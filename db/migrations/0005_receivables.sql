-- Obecný modul pohledávek (see docs/specs/receivables.md). One generic
-- "player owes the team X" record plus the payments that settle it. Nothing
-- here is destructive — both tables are new and created with IF NOT EXISTS, so
-- this file is a safe no-op against a database that already has them (see
-- db/migrations/README.md).

-- Money is whole CZK (INTEGER), same as season_calculations in
-- 0004_seasons.sql — there are no sub-unit amounts to represent and integers
-- keep the arithmetic exact.
--
-- player_id IS a real foreign key here, deliberately unlike
-- season_calculation_players (which snapshots names and keeps no FK). A locked
-- calculation is frozen history; a receivable is a live claim on a current
-- roster member. ON DELETE RESTRICT means removing a player who still has
-- receivables is refused rather than silently destroying payment history —
-- routes/players.ts turns that into a friendly 409.
--
-- status and source_type are a fixed set validated app-side, not by a DB
-- constraint — same convention as players.positions (0001_init.sql) and
-- events.event_type (0003_events.sql).
--   status:      pending | partially_paid | paid | cancelled
--   source_type: season | jersey | friendly_match | manual
-- status is maintained only by recalculateStatus() in routes/receivables.ts,
-- inside the same transaction as every payment insert/delete.
--
-- source_id points at whatever produced the receivable; for source_type
-- 'season' that is seasons.id (what the UI links back to). It is intentionally
-- not a foreign key — the column is polymorphic, so referential integrity for
-- season rows is enforced app-side instead.
CREATE TABLE IF NOT EXISTS receivables (
  id          SERIAL PRIMARY KEY,
  player_id   INTEGER NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
  title       TEXT NOT NULL,
  description TEXT,
  amount      INTEGER NOT NULL CHECK (amount > 0),
  due_date    DATE,
  status      TEXT NOT NULL DEFAULT 'pending',
  source_type TEXT NOT NULL DEFAULT 'manual',
  source_id   INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS receivables_player_id_idx ON receivables (player_id);

-- Makes "generate this season's receivables" idempotent in the database, not
-- just in app code: one receivable per player per season, so a re-run inserts
-- nothing new (ON CONFLICT DO NOTHING) instead of doubling everyone's debt.
CREATE UNIQUE INDEX IF NOT EXISTS receivables_season_source_idx
  ON receivables (source_id, player_id)
  WHERE source_type = 'season';

-- A receivable may be settled by one or more payments; the sum of these rows
-- is what drives receivables.status. ON DELETE CASCADE: deleting a receivable
-- is only allowed while it has no payments (routes/receivables.ts), so the
-- cascade never actually discards a recorded payment.
CREATE TABLE IF NOT EXISTS payments (
  id            SERIAL PRIMARY KEY,
  receivable_id INTEGER NOT NULL REFERENCES receivables(id) ON DELETE CASCADE,
  amount        INTEGER NOT NULL CHECK (amount > 0),
  paid_at       DATE NOT NULL,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_receivable_id_idx ON payments (receivable_id);
