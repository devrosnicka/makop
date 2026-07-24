# DB migrations

Every schema change is a plain numbered `.sql` file in this directory,
applied automatically — in filename order — by `backend/src/migrate.ts` at
backend startup, against every environment (local dev, and production once
it's deployed). There is no manual, hand-run SQL step anymore: add a file
here, deploy, done.

Applied filenames are recorded in a `schema_migrations` table so each file
runs exactly once per database.

The runner does **not** distinguish "safe" from "destructive" SQL — it runs
whatever a file contains, including `DROP COLUMN`. That's a deliberate
trade-off (see [ADR 0006](../../docs/decisions/0006-in-app-sql-migration-runner.md)):
automatic and zero-manual-steps, in exchange for every migration author
following the rules below. There is no safety net beyond code review, so
follow them.

## Rules for writing a migration

1. **Guarded and idempotent.** Use `CREATE TABLE IF NOT EXISTS`,
   `ADD COLUMN IF NOT EXISTS`, `DROP COLUMN IF EXISTS`, etc. Wrap any data
   backfill in a `DO $$ ... $$` block conditioned on the legacy state
   actually being present (e.g. `IF EXISTS (SELECT 1 FROM
   information_schema.columns WHERE table_name = 'players' AND column_name =
   'name')`). A migration must be a safe no-op when run against a database
   that's already past the change it makes — because we can't always be sure
   which shape a given environment (especially production) is in.

2. **Backfill before you tighten or drop.** Never `DROP COLUMN` or
   `ALTER COLUMN ... SET NOT NULL` before the replacement data has been
   populated for every existing row. Order within a file:
   add columns → backfill → tighten constraints → drop old columns.

3. **No silent data loss.** Any destructive step (`DROP COLUMN`, a type
   change, de-duplication) gets a comment at the top of the file calling it
   out, and the PR/review must confirm the backfill covers every row (e.g. no
   row is left with a `NULL` that a following `SET NOT NULL` would reject)
   before it merges.

4. **Append-only and immutable once shipped.** Never edit a migration file
   that has already run anywhere (including your own local dev DB, once
   you've merged) — add a new numbered file instead. If a file is still only
   local/unmerged, editing it in place is fine.

5. **Test both paths before merging:** a fresh volume (`docker compose down
   -v && docker compose up --build`), and — for any migration that touches an
   existing table/column — a simulated "legacy" DB state, to prove the
   backfill/guard actually converges old data correctly.

## Naming

`NNNN_short_description.sql`, four-digit, zero-padded, incrementing from the
last file in this directory.
