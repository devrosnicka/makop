-- Splits players.name -> first_name/last_name, and players.position (TEXT)
-- -> positions (TEXT[]). See docs/specs/player-roster.md for the feature
-- this belongs to.
--
-- DESTRUCTIVE: drops the legacy `name` and `position` columns at the end,
-- once their data has been copied. Guarded throughout (see
-- db/migrations/README.md) so this is a safe no-op in two cases: a fresh
-- volume, where 0001_init.sql already created the new shape and `name` never
-- existed; and a database that has already run this migration.

-- 1. Add the new columns, nullable for now (existing rows have no value yet).
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name  TEXT,
  ADD COLUMN IF NOT EXISTS positions  TEXT[] NOT NULL DEFAULT '{}';

-- 2. Backfill from the legacy columns, only if they still exist (i.e. only
--    on a database that predates this migration).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'name'
  ) THEN
    UPDATE players SET
      first_name = split_part(name, ' ', 1),
      -- Fallback to '-' so single-word names never leave last_name NULL —
      -- the NOT NULL constraint below would otherwise fail on those rows.
      last_name  = COALESCE(NULLIF(trim(substr(name, length(split_part(name, ' ', 1)) + 1)), ''), '-'),
      positions  = CASE WHEN position IS NULL THEN '{}' ELSE ARRAY[lower(position)] END
    WHERE first_name IS NULL;
  END IF;
END $$;

-- 3. Tighten constraints only after every existing row has been backfilled.
ALTER TABLE players
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name  SET NOT NULL;

-- 4. Drop the legacy columns last, now that their data lives in the new ones.
ALTER TABLE players
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS position;
