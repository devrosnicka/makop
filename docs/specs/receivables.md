# Feature: Receivables (obecný modul pohledávek)

## Why
[Season fee calculation](season-fee-calculation.md) works out *how much* each
player owes for a season, but nothing in the app tracks whether they actually
paid. Money owed to the team isn't only season fees either — jerseys, fines and
friendly matches all end up as "player X owes Y CZK". Rather than a
season-payments feature that would need re-inventing for every next kind of
debt, this adds one generic receivable: a title, an amount, a due date, a
player, and a `source_type`/`source_id` pair pointing back at whatever produced
it. Payments are recorded separately so one debt can be settled in instalments,
and the receivable's status follows from the sum of its payments rather than
being maintained by hand.

Source brief: `docs/specs/_zadani-task-2-modul-pohledavek.md` (Czech).

## User stories & acceptance criteria
- As a manager, I want to record an ad-hoc debt (jersey, fine) against a player,
  so that everything the team is owed lives in one place.
- As a manager, I want to turn a locked season calculation into one receivable
  per player, so that I don't retype the same amount N times.
- As a manager, I want to log partial payments, so that a player paying in two
  instalments is tracked accurately instead of "paid / not paid".
- As a manager, I want a list of who still owes what, so that I can chase it.
- [x] **AC1** — A receivable can be created manually: player, title, amount, and
      optionally description and due date.
- [x] **AC2** — A season with a locked calculation can generate one receivable
      per snapshotted player, for `player_contribution`, with
      `source_type = 'season'` and `source_id = seasons.id`. Re-running creates
      no duplicates.
- [x] **AC3** — Several payments can be recorded against one receivable.
- [x] **AC4** — `status` is derived automatically from the payment sum:
      `pending` → `partially_paid` → `paid`, and back again when a payment is
      deleted. `cancelled` is set explicitly and is never overwritten.
- [x] **AC5** — A debtor list shows, per player, the total still outstanding
      across their unpaid receivables.
- [x] Every `/api/receivables`, `/api/debtors` and
      `POST /api/seasons/:id/receivables` route requires a manager session
      (401 without one).
- [x] Deleting a player who has receivables is refused (409), not silently
      cascaded — payment history is never destroyed as a side effect.
- [x] Renders at ~375px with no horizontal overflow.

## Scope
**In scope:**
- `receivables` and `payments` tables.
- CRUD-ish backend routes: list/create/read receivables, add/delete payments,
  cancel a receivable, and the per-player debtor aggregate.
- `POST /api/seasons/:id/receivables` to generate a season's receivables.
- Frontend (Czech copy): `/receivables` with a **Pohledávky** / **Dlužníci**
  tab pair, a manual create form, and a receivable detail with its payments.

**Out of scope** (per the brief's "Mimo rozsah"):
- QR codes, bank APIs, automatic reconciliation of incoming transfers.
- Notifications and reminders.
- Editing a receivable after creation (cancel + create a new one instead).

## Technical approach
- **Key files/modules touched:**
  - `db/migrations/0005_receivables.sql` — both tables.
  - `backend/src/routes/receivables.ts` — `receivablesRoute(app)`, registered in
    `backend/src/server.ts` next to `seasonsRoute`.
  - `backend/src/routes/seasons.ts` — the generate endpoint + a guard on
    deleting a calculation whose receivables already exist.
  - `backend/src/routes/players.ts` — 409 instead of an FK error on delete.
  - `frontend/src/api/queries.ts` / `mutations.ts`, `frontend/src/lib/money.ts`,
    `frontend/src/components/receivables/`, `frontend/src/pages/Receivables*`,
    routes in `frontend/src/router.tsx`, nav entry in
    `frontend/src/components/layout/AppNav.tsx`.
- **Existing utilities/patterns to reuse:**
  - `backend/src/routes/seasons.ts` — transaction shape (`pool.connect()` +
    BEGIN/COMMIT/ROLLBACK), input parsing helpers, `app.authenticate`.
  - `frontend/src/pages/PlayerDetailPage.tsx` — `AlertDialog` destructive-action
    pattern, reused for deleting a payment / cancelling a receivable.
  - `formatCzk` / `parseAmount`, moved out of
    `frontend/src/components/seasons/calculation.ts` into
    `frontend/src/lib/money.ts` now that a second feature needs them.
- **Notable trade-offs or open questions:**
  - `status` is a **stored** column, recomputed inside the same transaction as
    every payment insert/delete, rather than derived at query time. The brief
    names it as a field, and it keeps list/aggregate queries simple; the cost is
    that it must never be written outside that helper.
  - `receivables.player_id` is a real FK with `ON DELETE RESTRICT` — the
    opposite of `season_calculation_players`, which snapshots names and keeps no
    FK. A calculation is frozen history; a debt is a live claim on a current
    roster member, so it should block the delete rather than orphan itself.
  - Overpayment is allowed (cash and rounding happen) and lands on `paid`; the
    UI shows the surplus rather than rejecting the payment.
  - `source_id` for season rows is `seasons.id`, not the calculation id — it is
    what the UI links back to. Deleting a calculation whose receivables exist is
    refused, so the reference can't dangle.
  - Money is whole-CZK `INTEGER`, consistent with `0004_seasons.sql`.
  - New UI copy is Czech, consistent with the season module.

## Verification
How we'll prove this works end-to-end (not just "tests pass"):
- [x] `cd backend && npm run build`, `cd frontend && npm run build`.
- [x] `docker compose up --build`; `0005_receivables.sql` shows as applied, and
      a second boot against the same volume is a no-op.
- [x] `curl -i localhost:3000/api/receivables` without a session → 401.
- [x] AC1 by hand in the UI; AC2 by generating from a locked season twice.
- [x] AC3/AC4: 800 CZK receivable, pay 300 → `partially_paid` (remaining 500),
      pay 500 → `paid`, delete that payment → `partially_paid` again.
- [x] AC5: debtor totals match the outstanding sums; a fully paid player drops
      off the list.
- [x] Deleting a player with receivables → 409, roster unchanged.
- [x] Renders correctly at a mobile viewport (~375px) — no horizontal overflow.
- [ ] Automated tests covering: none yet (no test harness in the repo per
      `CLAUDE.md`); add when the project's first one lands.
