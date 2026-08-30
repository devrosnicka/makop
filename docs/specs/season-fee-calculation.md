# Feature: Season fee calculation

## Why
The first item of the "Money" backlog group in `ROADMAP.md`: a manager needs to
know how much each player owes for a season. The inputs are simple (a per-player
registration fee, a referee fee per match, and how many matches must be paid
for), but the *result* must be stable — once the manager confirms the amount,
players get told what they owe, so it can never silently change afterwards.
That's why the confirmed calculation is stored as a locked snapshot, including
the list of players it was calculated for.

Source brief: `docs/specs/_zadani-task-1-vypocet-sezony.md` (Czech).

## User stories & acceptance criteria
- As a manager, I want to create a season and pick the players taking part in
  it, so that the fee is split across exactly the right people.
- As a manager, I want the app to compute the per-player contribution from the
  season's costs, so that I don't do the arithmetic by hand.
- As a manager, I want the confirmed calculation frozen, so that a player who
  joins later doesn't change what everyone else was already told to pay.
- [x] **AC1** — Given selected players and the three inputs, the app computes
      registration cost, referee cost, total season cost, and the per-player
      contribution (rounded **up** to whole CZK).
- [x] **AC2** — Confirming creates one `season_calculations` row for the season.
- [x] **AC3** — Confirming also creates a `season_calculation_players` snapshot
      row per selected player, storing the player's name at that moment.
- [x] **AC4** — A locked calculation's inputs cannot be changed (no edit path in
      the UI, no `PATCH` endpoint; a second `POST` for the same season → 409).
- [x] **AC5** — A locked calculation's player list cannot be changed.
- [x] **AC6** — Adding a new player to the roster does not affect an existing
      calculation (neither the amount nor the player list).
- [x] `GET /api/seasons`, `GET /api/seasons/:id`, `POST /api/seasons`,
      `POST /api/seasons/:id/calculation` and
      `DELETE /api/seasons/:id/calculation` all require a manager session
      (401 without one).
- [x] Correcting a mistake works by deleting the calculation and creating a new
      one; deleting also removes its player snapshot.
- [x] At least one player must be selected — an empty selection is rejected
      (400 from the API, blocked in the UI).

## Scope
**In scope:**
- `seasons`, `season_calculations`, `season_calculation_players` tables.
- Backend routes to list/create seasons, read a season with its calculation, and
  create/delete a calculation — gated by the existing `authenticate` guard.
- Frontend (Czech copy): season list, create-season form, season detail, and a
  3-step calculation wizard (players → inputs → summary & confirm).

**Out of scope** (per the brief's "Mimo rozsah"):
- QR payments, bank reconciliation, partial payments, per-player discounts or
  differing contributions.
- Automatic recalculation, or editing a locked calculation.
- Adding a player to an existing calculation later.
- Deleting or renaming a whole season (only the calculation can be deleted).

## Technical approach
- **Key files/modules touched:**
  - `db/migrations/0004_seasons.sql` — the three tables.
  - `backend/src/routes/seasons.ts` — `seasonsRoute(app)`; registered in
    `backend/src/server.ts` next to `eventsRoute`.
  - `frontend/src/api/queries.ts` / `mutations.ts` — `Season`,
    `SeasonCalculation`, `SeasonDetail` types; `seasonsQueryOptions`,
    `seasonDetailQueryOptions(id)`; `useCreateSeason`,
    `useCreateSeasonCalculation`, `useDeleteSeasonCalculation`.
  - `frontend/src/components/seasons/` — `calculation.ts` (pure formula +
    `formatCzk`), `SeasonCalculationForm.tsx` (the 3-step wizard).
  - `frontend/src/pages/` — `SeasonsPage`, `NewSeasonPage`, `SeasonDetailPage`,
    `NewSeasonCalculationPage`; routes in `frontend/src/router.tsx`, nav entry
    in `frontend/src/components/layout/AppNav.tsx`.
- **Existing utilities/patterns to reuse:**
  - `backend/src/routes/players.ts` — route/validation shape and the
    `app.authenticate` preHandler.
  - `frontend/src/components/players/NewPlayerForm.tsx` — multi-step wizard
    shape (progress bar, per-step validation).
  - `frontend/src/pages/PlayerDetailPage.tsx` — `AlertDialog` destructive-action
    pattern, reused for "delete calculation".
  - Shared `pg` pool (`backend/src/db.ts`), `apiFetch<T>()`
    (`frontend/src/api/client.ts`).
- **Notable trade-offs or open questions:**
  - Money is stored as whole-CZK `INTEGER`s. The brief's `ceil()` already
    assumes whole crowns, and integers avoid `NUMERIC`/float rounding entirely.
  - `season_calculation_players.player_id` is deliberately **not** a foreign
    key: deleting a player from the roster must not rewrite history. The name
    lives in `player_name_snapshot`.
  - `UNIQUE (season_id)` enforces one calculation per season in the database,
    not just in application code.
  - The server recomputes every derived amount from the raw inputs; values sent
    by the client are ignored. The frontend duplicates the formula
    (`components/seasons/calculation.ts`) only for the live preview.
  - `is_locked` exists per the brief but is always `TRUE` — nothing is persisted
    before confirmation, so there is no draft state.
  - New UI copy is Czech while the rest of the app is English — a deliberate,
    temporary inconsistency; translating the rest is a separate task.

## Verification
How we'll prove this works end-to-end (not just "tests pass"):
- [x] `cd backend && npm run build` and `cd frontend && npm run build` succeed.
- [x] `docker compose up --build`; `0004_seasons.sql` shows as applied in the
      backend log.
- [x] `curl -i localhost:3000/api/seasons` without a session cookie → **401**.
- [x] AC1 by hand: 11 players, fee 1000, referee 300 × 5 → registration 11 000,
      referee 1 500, total 12 500, contribution **1137** (ceil, 7 CZK surplus).
- [x] AC2/AC3: after confirming, the season detail shows the amounts and all 11
      snapshot names, and survives a reload.
- [x] AC4/AC5: a second `POST /api/seasons/:id/calculation` → **409**; the UI
      offers no edit affordance.
- [x] AC6: add a new player to the roster → the existing calculation's amount
      and player list are unchanged.
- [x] Delete a player who is in a snapshot → the snapshot name remains.
- [x] Delete the calculation → the season is "bez výpočtu" and can be
      recalculated.
- [x] Empty player selection → API **400**, wizard blocks "Pokračovat".
- [x] Renders correctly at a mobile viewport (~375px) — no horizontal overflow
      in the player checklist, the numeric inputs, or the summary.
- [ ] Automated tests covering: none yet (no test harness in the repo per
      `CLAUDE.md`); add when the project's first one lands.
