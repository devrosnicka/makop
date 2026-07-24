# Feature: Events & calendar

## Why
Before RSVP/availability features can exist, makop needs somewhere to
schedule the events players will respond to. This delivers the "Events &
calendar" backlog item in `ROADMAP.md`: a 7-day calendar view plus a way for
a manager to create an event (match, training, or a one-off).

## User stories & acceptance criteria
- As a manager, I want to see the next 7 days at a glance, so that I know
  what's coming up this week.
- As a manager, I want to see how many events are scheduled further out, so
  that I'm not blind to things beyond this week.
- As a manager, I want to create an event with just a type and a date, so
  that the common case is quick, while still being able to record a time,
  address, and description when I have them.
- [ ] `GET /api/events` returns every event ordered by `event_date`, then
      `start_time` (events with no time first); requires a valid manager
      session (401 without one).
- [ ] `POST /api/events` creates an event given a valid `event_type`
      (`friendly_match` / `league_match` / `custom`) and `event_date`
      (`YYYY-MM-DD`); rejects either missing/invalid with 400; `title`,
      `start_time` (`HH:MM`), `address`, `description` may be omitted;
      requires a valid manager session (401 without one).
- [ ] `/calendar` shows today plus the next 6 days as squares (weekday + day
      number), today visually highlighted, each square marked when it has
      one or more events for that day.
- [ ] `/calendar` shows a "+N" indicator for events whose date falls after
      the 7-day window, N being that count; hidden when N is 0.
- [ ] `/calendar/new` is a full-screen, 3-step form, one tier per step: (1)
      event type + optional title, (2) date (required) + time (optional —
      blank means all-day), (3) address + description. The manager can save
      from any step once type and date are valid, or continue to the next
      tier. All fields are full-width/stacked (mobile-first).
- [ ] Saving a new event navigates back to `/calendar`; the event persists
      across a page reload and appears on the correct day.

## Scope
**In scope:**
- An `events` table: `event_type`, `event_date` (required), `title`,
  `start_time`, `address`, `description` (all optional).
- Backend routes to list and create events, gated by the existing
  `authenticate` guard.
- Frontend: the 7-day calendar strip (`CalendarPage`) and a full-screen
  multi-step create form (`NewEventPage` / `NewEventForm`).

**Out of scope:**
- Editing or deleting an existing event — add `PATCH`/`DELETE` endpoints
  later if needed, following the player roster's delete pattern
  (`docs/specs/player-roster.md`).
- Month/agenda views beyond the 7-day strip.
- RSVP/availability, headcount, or any player-facing linkage — those are
  separate future features (see `ROADMAP.md`, "Availability (RSVP)").
- Recurring events.

## Technical approach
- **Key files/modules touched:**
  - `db/migrations/0003_events.sql` — `events` table.
  - `backend/src/db.ts` — registers a raw-string type parser for Postgres
    `DATE` columns (OID 1082); `pg` otherwise parses `DATE` into a JS `Date`
    at UTC midnight, which would drift a day in negative-UTC-offset
    timezones once serialized to JSON — the opposite of what storing
    `event_date`/`start_time` as separate columns was meant to avoid.
  - `backend/src/routes/events.ts` — `eventsRoute(app)` with
    `GET /api/events`, `POST /api/events`; exports `EVENT_TYPES`.
  - `frontend/src/api/queries.ts` / `mutations.ts` — `MakopEvent`/`EventType`/
    `NewEvent` types, `eventsQueryOptions`, `useCreateEvent`.
  - `frontend/src/components/events/` — `eventTypes.ts` (canonical type list
    + labels), `NewEventForm.tsx` (the 3-step wizard).
  - `frontend/src/pages/CalendarPage.tsx` (7-day strip + "+N"),
    `NewEventPage.tsx` (create, `/calendar/new`).
  - `frontend/src/router.tsx` — `newEventRoute` behind `requireAuth`;
    `calendarRoute` also `ensureQueryData(eventsQueryOptions)` so a direct
    load/refresh works, same pattern as `playerDetailRoute`.
- **Existing utilities/patterns to reuse:**
  - `backend/src/routes/players.ts` — route/validation shape (`optionalText`,
    an enum-membership guard) copied directly for events.
  - `frontend/src/components/players/NewPlayerForm.tsx` — multi-step wizard
    shape (progress bar, tiered validation, save-from-any-step) copied
    directly for `NewEventForm`.
  - Shared `pg` pool (`backend/src/db.ts`), `app.authenticate` guard
    (`backend/src/auth/plugin.ts`), `apiFetch<T>()`
    (`frontend/src/api/client.ts`).
- **Notable trade-offs or open questions:**
  - `event_date`/`start_time` are separate `DATE`/`TIME` columns rather than
    one `TIMESTAMPTZ`, to keep "which day is this event on" a plain string
    comparison for the 7-day strip and avoid timezone-conversion bugs.
  - `event_type` is a Postgres `TEXT` validated app-side against
    `EVENT_TYPES`, not a DB constraint — same convention as
    `players.positions`.
  - No edit/delete endpoints yet — see Scope.

## Verification
How we'll prove this works end-to-end (not just "tests pass"):
- [ ] `cd backend && npm run build` and `cd frontend && npm run build` both
      succeed.
- [ ] `docker compose up --build`; confirm `0003_events.sql` applied in
      backend logs.
- [ ] `curl -i localhost:3000/api/events` without a session cookie returns
      **401**.
- [ ] Log in as a seeded manager; `/calendar` shows 7 day-squares, today
      highlighted, no markers, no "+N" yet.
- [ ] Create an event via `/calendar/new` with all fields filled → today's
      square shows a marker after redirect to `/calendar`.
- [ ] Create an event 8+ days out → "+N" appears with count 1; add another →
      count becomes 2.
- [ ] Create an event with only type + date → saves fine, renders as
      all-day.
- [ ] Automated tests covering: none yet (no test setup in the repo per
      `CLAUDE.md`); add when the project's first test harness lands.
