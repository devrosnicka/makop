# ADR 0006: In-app SQL migration runner

**Status:** Accepted

## Context
ADR 0001 deferred schema migrations entirely: `db/init.sql`, mounted into
Postgres's init directory, only ever runs when the volume is fresh and empty.
Every schema change since has needed a hand-run SQL step over SSH against any
volume that predates it — this has already bitten production once (see the
"Deploy caveat" in `docs/specs/manager-auth.md`), and the `players` rework
(`name`/`position` → `first_name`/`last_name`/`positions[]`) left production
needing another one, discovered only when the developer went to apply it and
realized there was no clear procedure — and no way to be fully sure what
shape the production `players` table was even in beforehand.

GitHub Actions already redeploys the backend automatically on every push to
`main` (see `.github/workflows/deploy.yml`); only the database was left out
of that automation. The recurring manual step — SSH in, `psql`, paste an
`ALTER` — doesn't scale as schema changes get more frequent, and is exactly
the kind of step that's easy to forget or get wrong under time pressure.

## Decision
Add a small, dependency-free SQL migration runner (`backend/src/migrate.ts`)
that executes automatically at backend startup, before `app.listen()`:

- Migrations are plain `.sql` files in `db/migrations/`, applied in filename
  order; applied filenames are recorded in a `schema_migrations` table so each
  runs exactly once per database.
- The backend Docker image bundles `db/migrations/` (`COPY db/migrations
  ./db/migrations` in `backend/Dockerfile`), so production converges its
  schema automatically on every deploy — no SSH, no manual `psql` step, ever
  again.
- `db/init.sql` is retired; its content becomes `db/migrations/0001_init.sql`,
  so there is exactly one schema source instead of two competing ones (a
  Postgres-init-only file and a hand-run doc).
- Kept intentionally minimal — raw `pg`, no ORM/migration library (Umzug,
  node-pg-migrate, etc.) — in keeping with ADR 0001's SQL-first stance. This
  is the "revisit" ADR 0001 flagged, but the schema didn't outgrow raw SQL —
  the *deployment* process outgrew doing it by hand.

**Safety trade-off (explicitly discussed):** the runner does not distinguish
"safe" from "destructive" SQL — it applies whatever a migration file
contains, including a `DROP COLUMN`. Auto-running unreviewed destructive SQL
against production data is risky in general. We accept that risk in exchange
for full automation, on the condition that every migration author follows the
rules in `db/migrations/README.md` — guarded/idempotent SQL, backfill fully
before tightening or dropping anything, destructive steps called out and
checked in review, files immutable once shipped. The README is the guardrail
that makes "auto-run everything" acceptable on a solo project; it would need
revisiting (e.g. a dry-run/staging step, or gating destructive migrations
behind manual approval) if more people start authoring migrations.

## Consequences
- Adding or changing a table is now: write a new numbered `.sql` file in
  `db/migrations/`, following the README's rules, and push to `main`. Nothing
  else — no SSH, no `psql`, no separately-documented manual `ALTER`.
- A bad migration now fails backend startup loudly (the runner throws,
  `server.ts`'s existing catch logs and `process.exit(1)`s) rather than
  silently drifting — but it also means a broken migration blocks deploys
  until fixed, including on the VPS, so migrations need the same care as any
  other prod-affecting change.
- `docs/specs/player-roster.md`'s hand-run `ALTER` note is superseded by
  `db/migrations/0002_players_name_split.sql`, written to the README's rules.
- Local dev's `docker-compose.yml` now bind-mounts `./db:/app/db:ro` into the
  backend container so the runner can see migration files there too (the
  compose backend doesn't build the Dockerfile — it runs `npm run dev`
  directly against the mounted source).
