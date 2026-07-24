-- Baseline schema. Guarded with IF NOT EXISTS so this is a no-op against any
-- database that already has these tables (e.g. production's existing
-- `users`, or a `players` table still in its legacy shape — see
-- 0002_players_name_split.sql for that conversion).

-- Manager authentication (see docs/specs/manager-auth.md, ADR 0003).
-- Acts as an email allowlist: a Google login only succeeds if the verified
-- email already exists here. No passwords are stored — identity is verified
-- by Google; this table only gates access.
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  google_sub TEXT UNIQUE,
  name       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Player roster (see docs/specs/player-roster.md). Basic contact details for
-- team members; only `first_name`/`last_name` are required. `positions` is a
-- fixed set (defender/goalkeeper/attacker) validated app-side, not by a DB
-- constraint. No teams/grouping concept yet — there's only one team.
CREATE TABLE IF NOT EXISTS players (
  id            SERIAL PRIMARY KEY,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  jersey_number INTEGER,
  positions     TEXT[] NOT NULL DEFAULT '{}',
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
