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
- As a manager, I want the common case (just a name) to be quick, while still
  being able to record more detail when I have it.
- As a manager, I want to remove a player, so that the roster stays accurate
  when someone leaves.
- [ ] `GET /api/players` returns the full roster ordered by jersey number
      ascending, with players who have no jersey number last (then by last
      name, first name as a tiebreak); requires a valid manager session (401
      without one).
- [ ] `POST /api/players` creates a player given at least `first_name` and
      `last_name`; rejects either missing/empty with 400; `positions` (an
      array restricted to `defender`/`goalkeeper`/`attacker`) and
      `jersey_number`/`phone`/`email`/`notes` may be omitted; requires a valid
      manager session (401 without one).
- [ ] `DELETE /api/players/:id` removes a player by id; 404 if the id doesn't
      exist; requires a valid manager session (401 without one).
- [ ] The roster page is only visible/usable on the frontend when signed in as
      a manager.
- [ ] The roster (`/players`) is a tappable list — name, jersey number, and
      position badges per row — with an "Add player" button, no inline form.
- [ ] Tapping a roster row opens that player's detail page
      (`/players/:id`), showing all fields, with **Delete** (works, behind a
      confirmation) and **Edit** (visibly disabled placeholder — see Scope).
- [ ] "Add player" (`/players/new`) is a full-screen, 4-step form, one tier per
      step: (1) first/last name — required, (2) phone, (3) positions +
      jersey number, (4) email + notes. The manager can save from any step
      once tier 1 is valid, or continue to the next tier. All fields are
      full-width/stacked (mobile-first).
- [ ] Saving a new player navigates to that player's detail page; the player
      persists across a page reload.
- [ ] Deleting a player (with confirmation) returns to the roster list and the
      player no longer appears after a page reload.

## Scope
**In scope:**
- A `players` table: `first_name`, `last_name` (required), `phone`,
  `positions` (multi-value, fixed set), `jersey_number`, `email`, `notes`
  (all optional).
- Backend routes to list, create, and delete players, gated by the existing
  `authenticate` guard.
- Frontend: a tappable roster list (`PlayersPage`), a player detail page
  (`PlayerDetailPage`), and a full-screen multi-step add form
  (`NewPlayerPage` / `NewPlayerForm`) — see Technical approach.

**Out of scope:**
- Editing an existing player. The detail page has a disabled **Edit** button
  as a placeholder; delete + re-add still covers corrections for now. When
  edit is built, it's expected to reuse `NewPlayerForm`'s steps against a
  `PATCH`/`PUT` endpoint that doesn't exist yet.
- Any team/roster grouping — there is only one team, so no `teams` table.
- Photos, jersey history, or any RSVP/attendance linkage — those are separate
  future features.
- Bulk import/export.

## Technical approach
- **Key files/modules touched:**
  - `db/init.sql` — `players` table (`first_name`, `last_name`, `positions
    TEXT[]`, ...). See migration note below for already-initialized DBs.
  - `backend/src/routes/players.ts` — `playersRoute(app)` with
    `GET /api/players`, `POST /api/players`, `DELETE /api/players/:id`;
    exports `PLAYER_POSITIONS` (the allowed `positions` values).
  - `frontend/src/api/queries.ts` / `mutations.ts` — `Player`/`PlayerPosition`/
    `NewPlayer` types, `playersQueryOptions`, `useCreatePlayer`,
    `useDeletePlayer`.
  - `frontend/src/components/players/` — feature components shared across
    pages: `positions.ts` (canonical position list + labels),
    `PositionBadges.tsx`, `PlayerListItem.tsx` (tappable roster row),
    `NewPlayerForm.tsx` (the 4-step wizard).
  - `frontend/src/pages/PlayersPage.tsx` (list), `NewPlayerPage.tsx` (add,
    `/players/new`), `PlayerDetailPage.tsx` (detail + delete + disabled edit,
    `/players/$playerId`).
  - `frontend/src/router.tsx` — routes for the two new pages, both behind
    `requireAuth`; the detail route also `ensureQueryData(playersQueryOptions)`
    so a direct load/refresh works. `playerDetailRoute` is exported (like
    `loginRoute`) so `PlayerDetailPage` can read `$playerId` via
    `.useParams()`.
- **Existing utilities/patterns to reuse:**
  - Shared `pg` pool: `backend/src/db.ts` (`import { pool } from '../db.js'`).
  - Auth guard: `app.authenticate` preHandler from `backend/src/auth/plugin.ts`.
  - Frontend fetch wrapper: `apiFetch<T>()` in `frontend/src/api/client.ts`.
  - shadcn primitives added for this rework: `badge`, `toggle-group`,
    `textarea`, `alert-dialog` (via `npx shadcn add` — see ADR 0004).
- **Notable trade-offs or open questions:**
  - No edit endpoint yet — see Scope. The disabled Edit button on the detail
    page is a deliberate placeholder.
  - `positions` is a Postgres `TEXT[]` validated app-side against
    `PLAYER_POSITIONS`, not a DB constraint or a junction table — appropriate
    for a fixed 3-value set on a solo project; revisit if positions become
    configurable.
  - `db/init.sql` only runs on a fresh, empty Postgres volume (per
    `CLAUDE.md`). Any already-initialized DB (local dev volume, and
    production once deployed) needs this hand-run migration instead:
    ```sql
    ALTER TABLE players
      ADD COLUMN first_name TEXT,
      ADD COLUMN last_name  TEXT,
      ADD COLUMN positions  TEXT[] NOT NULL DEFAULT '{}';
    UPDATE players SET
      first_name = split_part(name, ' ', 1),
      last_name  = NULLIF(trim(substr(name, length(split_part(name,' ',1)) + 1)), ''),
      positions  = CASE WHEN position IS NULL THEN '{}' ELSE ARRAY[lower(position)] END;
    -- review rows where last_name ended up NULL before proceeding
    ALTER TABLE players
      ALTER COLUMN first_name SET NOT NULL,
      ALTER COLUMN last_name  SET NOT NULL,
      DROP COLUMN name,
      DROP COLUMN position;
    ```
    Run via `docker compose -f docker-compose.prod.yml exec db psql -U "$DB_USER" -d "$DB_NAME"`
    in prod (or the equivalent dev-compose command locally).
  - **Superseded (this rework):** the original single-page table + inline add
    form (`App.tsx` panel, then `PlayersPage.tsx` with an always-visible
    form) is replaced by the tappable list / detail page / multi-step add
    flow described above. The `name` and `position` (singular, free-text)
    columns are replaced by `first_name`/`last_name`/`positions[]`.

## Verification
How we'll prove this works end-to-end (not just "tests pass"):
- [ ] `cd backend && npm run build` and `cd frontend && npm run build` both
      succeed.
- [ ] `docker compose up --build` (fresh volume so `init.sql` creates the new
      `players` shape), or the hand-run migration above against an existing
      volume; seed an allowlisted manager per `CLAUDE.md` and log in via
      Google.
- [ ] `curl -i localhost:3000/api/players` without a session cookie returns
      **401**.
- [ ] In a mobile viewport: roster shows tappable rows (name, jersey, position
      badges); "Add player" opens the full-screen 4-step form; Save is
      disabled until first/last name are filled, works from step 1, and
      `Continue` reaches the phone / positions+jersey / email+notes steps;
      positions toggle chips allow multiple selections; a non-integer jersey
      number is rejected; saving lands on the new player's detail page and the
      player persists across a reload.
- [ ] Detail page shows all fields; Delete asks for confirmation, then removes
      the player and returns to the roster (gone after reload); Edit is
      visibly disabled.
- [ ] Automated tests covering: none yet (no test setup in the repo per
      `CLAUDE.md`); add when the project's first test harness lands.
