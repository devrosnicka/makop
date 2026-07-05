# makop

## Project
`makop` is a web app. (One-liner to expand as the product direction firms up.)

## Stack
See [`docs/decisions/0001-choose-stack.md`](docs/decisions/0001-choose-stack.md) for the full rationale.

- **Backend:** Node 24 + TypeScript + Fastify, raw `pg` driver (no ORM yet).
- **Frontend:** React + Vite + TypeScript (SPA), served via `/api` proxy in dev
  and as static files from Fastify in prod.
- **Database:** PostgreSQL 16, schema seeded via `db/init.sql`. **Caveat:**
  this only runs when Postgres initializes a *fresh, empty* volume — it does
  **not** apply to an already-initialized database. Every schema change needs
  its SQL run by hand against any environment whose volume predates the
  change (in practice: production, once it's been deployed once). No
  migration tool yet (per ADR 0001).
- **Infra:** Docker (multi-stage build) + Docker Compose; production runs
  behind a shared `caddy-docker-proxy` on the VPS (owns ports 80/443,
  routes by Docker labels over the external `caddy_net` network — see
  [ADR 0002](docs/decisions/0002-shared-reverse-proxy.md)); GitHub Actions →
  GHCR → VPS deploy.
- **Auth:** manager/admin routes are gated by Google login (OAuth) + a
  stateless JWT session cookie; the `users` table is an email allowlist, not
  an account system — see [ADR 0003](docs/decisions/0003-manager-authentication.md)
  and [the spec](docs/specs/manager-auth.md). Player-facing features (RSVP)
  stay login-less by design.

## Commands
- Dev server: `docker compose up --build` (Postgres + Fastify @:3000 + Vite @:5173)
  - Copy `.env.example` to `.env` and fill in Google OAuth credentials to
    exercise login locally; the app runs fine without them, login just won't work.
- Build (prod image): `docker compose -f docker-compose.prod.yml build`
- Backend typecheck/build: `cd backend && npm run build`
- Frontend build: `cd frontend && npm run build`
- Seed an allowed manager login: run SQL directly against the DB, e.g.
  `INSERT INTO users (email, name) VALUES ('you@example.com', 'You') ON CONFLICT (email) DO NOTHING;`
  — in prod, over SSH via `docker compose -f docker-compose.prod.yml exec db psql -U "$DB_USER" -d "$DB_NAME"`.
- Test: none yet — add when the first real feature lands
- Lint: none yet — add when the first real feature lands

## Planning workflow
This repo is the source of truth for planning — docs live here so Claude Code
reads them every session, not in a separate tool.

- **`ROADMAP.md`** — a living, product-only feature backlog, grouped by status
  (In progress / Ideas / Done). Add or remove items freely; no technical
  decisions here. Start here for "what might makop do."
- **`docs/specs/`** — one file per feature, copied from `docs/specs/_TEMPLATE.md`.
  Write the spec *before* implementing a feature. Only some roadmap items get
  one, and only once work actually starts — linking from the roadmap is
  optional/lazy, not required.
- **`docs/decisions/`** — lightweight ADRs (one per significant decision), copied
  from `docs/decisions/_TEMPLATE.md`. Captures *why*, so context survives across
  sessions.
- Work via **plan → approve → execute**: use plan mode for anything non-trivial,
  get explicit approval, then implement.

## Conventions
- Commit small and often; commit messages explain *why*, not just *what*.
- Work off `main` directly is fine for now (solo project); revisit branching
  if collaborators join.
- Before marking a feature done, verify it end-to-end (run it, don't just read
  the diff) and check its spec's acceptance criteria.

## Guardrails
- Keep this file current — update it whenever stack, commands, or conventions change.
- Keep specs small and testable; prefer several focused specs over one sprawling one.
- Don't invent new roadmap items without adding them to `ROADMAP.md` first.
