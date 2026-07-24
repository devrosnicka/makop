-- Events & calendar (see ROADMAP.md, docs/specs/events-calendar.md). Basic
-- scheduling info for team events; only `event_type` and `event_date` are
-- required. `event_type` is a fixed set (friendly_match/league_match/custom)
-- validated app-side, not by a DB constraint — same convention as
-- players.positions (see 0001_init.sql). `start_time` is nullable: NULL means
-- an all-day event.
CREATE TABLE IF NOT EXISTS events (
  id          SERIAL PRIMARY KEY,
  event_type  TEXT NOT NULL,
  title       TEXT,
  event_date  DATE NOT NULL,
  start_time  TIME,
  address     TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
