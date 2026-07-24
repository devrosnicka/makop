# ADR 0001: Choose the tech stack

**Status:** Accepted

## Context
`makop` is a new web app, starting from an empty repo. No stack has been
chosen yet. This decision blocks M0 (see [ROADMAP.md](../../ROADMAP.md)) and
needs to be made before scaffolding the app.

Things to weigh: frontend framework, backend/API approach (or full-stack
framework), database, hosting/deploy target, and how much of this the solo
developer wants to manage vs. outsource to a platform.

The developer has an existing PoC, [`devrosnicka/meal-suggester`](https://github.com/devrosnicka/meal-suggester),
with a working end-to-end setup: Node.js + TypeScript + Fastify + PostgreSQL,
dockerized for local dev, deployed via GitHub Actions to a Hetzner VPS behind
Caddy (auto-HTTPS), images pushed to GHCR. A hard requirement is that the app
runs fully locally via Docker so Claude Code can verify changes before they're
pushed.

## Decision
Reuse the PoC's stack and infrastructure, adding React for the frontend since
makop's scope (roster, calendar, RSVP, money tracking) is much larger than the
PoC's single page:

- **Backend:** Node 24 + TypeScript + Fastify, raw `pg` driver. No ORM or
  migration tool yet — keep it minimal and SQL-first like the PoC; revisit once
  the schema grows past what hand-written SQL + `db/init.sql` seeding can
  comfortably handle. **Superseded:** the "revisit" happened in
  [ADR 0006](0006-in-app-sql-migration-runner.md) — the schema stayed raw SQL,
  but seeding/migrating it moved off `db/init.sql`'s fresh-volume-only
  mechanism onto an in-app runner, since the manual hand-run-SQL step (not the
  schema itself) is what stopped scaling.
- **Frontend:** React + Vite + TypeScript (SPA). Vite dev server with HMR in
  development, proxying `/api` to the backend; `vite build` output served as
  static files by Fastify (`@fastify/static`) in production — same
  single-origin pattern as the PoC.
- **Database:** PostgreSQL 16 (`postgres:16-alpine`), schema applied via an
  in-app migration runner (`db/migrations/`) — see
  [ADR 0006](0006-in-app-sql-migration-runner.md). Originally seeded via
  `db/init.sql` mounted into the container's init directory; that only ran on
  a fresh volume, which ADR 0006 replaced.
- **Infra:** multi-stage Docker build; `docker-compose.yml` for local dev,
  `docker-compose.prod.yml` + `Caddyfile` for production; images built and
  pushed to GHCR and deployed to a VPS by a GitHub Actions workflow
  (SCP + SSH) — all adapted from the PoC.

## Consequences
- One language (TypeScript) across backend and frontend — easier for a solo
  developer to context-switch, and for Claude Code to reason about both sides.
- The whole stack runs locally with `docker compose up`, so changes can be
  verified end-to-end before every push, per the developer's requirement.
- No ORM/migrations means schema changes are hand-written SQL for now; this is
  a deliberate simplicity trade-off, not a permanent one — reconsider (e.g.
  Drizzle or node-pg-migrate) once several related tables and foreign keys
  make raw SQL unwieldy.
- No auth yet. RSVP is designed as login-less shared links (per the roadmap),
  but the manager-facing admin side will eventually need auth — deferred to a
  future ADR/spec.
- Production deploy depends on a VPS + domain + GitHub Actions secrets
  (`VPS_HOST`, `VPS_SSH_KEY`, `DB_PASSWORD`, etc.) that don't exist yet for
  this project; the CI workflow and Caddyfile are scaffolded with placeholders
  until the developer provisions a server.
