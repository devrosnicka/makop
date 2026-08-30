-- Season fee calculation (see docs/specs/season-fee-calculation.md). A season
-- holds one confirmed, locked calculation plus a snapshot of the players it
-- was calculated for. Nothing here is destructive — all three tables are new
-- and created with IF NOT EXISTS, so this file is a safe no-op against a
-- database that already has them (see db/migrations/README.md).

CREATE TABLE IF NOT EXISTS seasons (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  -- Manager's email from the session JWT; nullable so a season created by an
  -- unknown/legacy path still stores.
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Money is whole CZK (INTEGER): the brief rounds the per-player contribution
-- up to whole crowns, so there are no sub-unit amounts to represent, and
-- integers keep the arithmetic exact.
--
-- UNIQUE (season_id) enforces "exactly one calculation per season" in the
-- database, not just in app code — correcting a mistake means deleting the
-- calculation and creating a new one, never editing it.
--
-- is_locked exists because the brief names it, but this version never writes
-- FALSE: a calculation is only persisted once the manager confirms it, so it
-- is locked from birth. Left in place for a future draft state.
CREATE TABLE IF NOT EXISTS season_calculations (
  id                      SERIAL PRIMARY KEY,
  season_id               INTEGER NOT NULL UNIQUE REFERENCES seasons(id) ON DELETE CASCADE,
  player_registration_fee INTEGER NOT NULL,
  referee_match_fee       INTEGER NOT NULL,
  referee_match_count     INTEGER NOT NULL,
  selected_players_count  INTEGER NOT NULL,
  registration_cost       INTEGER NOT NULL,
  referee_cost            INTEGER NOT NULL,
  total_season_cost       INTEGER NOT NULL,
  player_contribution     INTEGER NOT NULL,
  is_locked               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Who the contribution was split between, frozen at confirmation time.
-- player_id is deliberately NOT a foreign key and is nullable: removing a
-- player from the roster must never rewrite or delete history. The identity
-- that matters here is player_name_snapshot, captured server-side from the
-- players table at the moment of confirmation.
CREATE TABLE IF NOT EXISTS season_calculation_players (
  id                    SERIAL PRIMARY KEY,
  season_calculation_id INTEGER NOT NULL REFERENCES season_calculations(id) ON DELETE CASCADE,
  player_id             INTEGER,
  player_name_snapshot  TEXT NOT NULL,
  UNIQUE (season_calculation_id, player_id)
);
