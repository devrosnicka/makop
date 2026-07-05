-- Placeholder schema for the makop skeleton. Real tables (players, events,
-- RSVPs, payments, ...) get added here as features are built — see
-- docs/specs/ for the feature that introduces each one.

CREATE TABLE IF NOT EXISTS schema_placeholder (
  id         SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
