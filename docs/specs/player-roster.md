# Feature: Player roster

## Why
makop needs a basic list of team members before any scheduling or RSVP
features can reference them. Manager authentication (ADR 0003,
`docs/specs/manager-auth.md`) was built specifically to gate this feature,
since it stores personal contact details (name, phone, email). This is the
first item under **Team & players** in `ROADMAP.md`.

## User stories & acceptance criteria
- As a manager, I want to see a list of players, so that I know who's on the team.
- As a manager, I want to add a player with their contact details, so that I can
  build up the roster over time.
- As a manager, I want to remove a player, so that the roster stays accurate
  when someone leaves.
- [ ] `GET /api/players` returns the full roster, ordered by name; requires a
      valid manager session (401 without one).
- [ ] `POST /api/players` creates a player given at least a name; rejects a
      missing/empty name with 400; optional fields (email, phone, jersey
      number, position, notes) may be omitted; requires a valid manager
      session (401 without one).
- [ ] `DELETE /api/players/:id` removes a player by id; 404 if the id doesn't
      exist; requires a valid manager session (401 without one).
- [ ] The roster panel is only visible/usable on the frontend when signed in
      as a manager.
- [ ] Adding a player through the UI updates the visible list without a page
      reload; the player persists across a page reload.
- [ ] Deleting a player through the UI removes it from the visible list and it
      no longer appears after a page reload.

## Scope
**In scope:**
- A `players` table: name (required), email, phone, jersey number, position,
  notes (all optional except name).
- Backend routes to list, create, and delete players, gated by the existing
  `authenticate` guard.
- A frontend panel (in `App.tsx`, alongside the existing sign-in panel) to
  view, add, and delete players.

**Out of scope:**
- Editing an existing player (delete + re-add covers corrections for now).
- Any team/roster grouping — there is only one team, so no `teams` table.
- Photos, jersey history, or any RSVP/attendance linkage — those are separate
  future features.
- Bulk import/export.

## Technical approach
- **Key files/modules touched:**
  - `db/init.sql` — add `CREATE TABLE IF NOT EXISTS players (...)`.
  - `backend/src/routes/players.ts` (new) — `playersRoute(app)` with
    `GET /api/players`, `POST /api/players`, `DELETE /api/players/:id`.
  - `backend/src/server.ts` — register `playersRoute` after `authPlugin`.
  - `frontend/src/App.tsx` — add a `RosterPanel` component and `Player` type.
- **Existing utilities/patterns to reuse:**
  - Shared `pg` pool: `backend/src/db.ts` (`import { pool } from '../db.js'`).
  - Auth guard: `app.authenticate` preHandler from `backend/src/auth/plugin.ts`
    (same pattern as the placeholder `/api/whoami` route in
    `backend/src/routes/auth.ts`).
  - Frontend fetch wrapper: `apiFetch<T>()` in `frontend/src/api/client.ts`
    (sends the session cookie, JSON-encodes bodies).
  - Conditional-render-on-`useAuth()` pattern already used for
    `SignedInPanel`/`LoginPanel` in `App.tsx`.
- **Notable trade-offs or open questions:**
  - No edit endpoint yet — acceptable given the small roster size expected;
    revisit if this proves annoying in practice.
  - `db/init.sql` only runs on a fresh, empty Postgres volume (per
    `CLAUDE.md`). The `players` table must be created by hand against any
    already-initialized environment (in practice, production once deployed):
    `docker compose -f docker-compose.prod.yml exec db psql -U "$DB_USER" -d "$DB_NAME"`
    then run the `CREATE TABLE` statement from `db/init.sql`.
  - No router introduced — the roster lives as a panel in the single-page
    `App.tsx`, consistent with the app's current structure. **Superseded:**
    [ADR 0005](../decisions/0005-adopt-tanstack-router-and-query.md) later
    introduced TanStack Router/Query; the roster now lives at `/players`
    (`frontend/src/pages/PlayersPage.tsx`) on Query hooks instead of a panel
    with manual `useEffect` fetching.

## Verification
How we'll prove this works end-to-end (not just "tests pass"):
- [ ] `cd backend && npm run build` and `cd frontend && npm run build` both
      succeed.
- [ ] `docker compose up --build` (fresh volume so `init.sql` creates
      `players`); seed an allowlisted manager per `CLAUDE.md` and log in via
      Google.
- [ ] `curl -i localhost:3000/api/players` without a session cookie returns
      **401**.
- [ ] As a signed-in manager: add a player (with and without optional
      fields), see it appear in the list, reload the page and confirm it
      persists, delete it, confirm it disappears and stays gone after reload.
- [ ] Attempting to add a player with an empty name is rejected by the form/API.
- [ ] Automated tests covering: none yet (no test setup in the repo per
      `CLAUDE.md`); add when the project's first test harness lands.
