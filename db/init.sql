-- Schema for the makop app. Real tables get added here as features are
-- built — see docs/specs/ for the feature that introduces each one.

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
-- team members; only `name` is required. No teams/grouping concept yet —
-- there's only one team.
CREATE TABLE IF NOT EXISTS players (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  jersey_number INTEGER,
  position      TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
