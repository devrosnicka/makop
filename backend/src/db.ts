import pg from 'pg';

const { Pool, types } = pg;

// By default node-postgres parses DATE columns (OID 1082) into JS Date
// objects at UTC midnight, which round-trips through JSON as an ISO
// timestamp and drifts a day in negative-UTC-offset timezones. Keep DATE
// values as the plain 'YYYY-MM-DD' string Postgres sends — same as TIME,
// which pg already leaves as a string — so `events.event_date` never needs
// timezone-aware parsing (see db/migrations/0003_events.sql).
types.setTypeParser(1082, (value: string) => value);

export const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'makop',
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  max: 10,
  idleTimeoutMillis: 30_000,
});
