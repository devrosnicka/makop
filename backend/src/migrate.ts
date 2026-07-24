import { readdir, readFile } from 'fs/promises';
import path from 'path';
import type { FastifyBaseLogger } from 'fastify';
import { pool } from './db.js';

// Applies any not-yet-applied .sql files from db/migrations/, in filename
// order, recording each in `schema_migrations` so it only ever runs once per
// database. See db/migrations/README.md for the rules migration authors
// follow (guarded/idempotent, backfill-before-drop) — this runner itself
// applies whatever a file contains, including destructive SQL, with no
// safety net beyond those authoring rules.
//
// A fixed advisory lock key guards against two instances racing on boot
// (e.g. a rolling deploy briefly overlapping the old container).
const ADVISORY_LOCK_KEY = 727_001;

function migrationsDir(): string {
  return process.env.MIGRATIONS_DIR ?? path.join(process.cwd(), 'db/migrations');
}

export async function runMigrations(log?: FastifyBaseLogger): Promise<void> {
  const dir = migrationsDir();
  const client = await pool.connect();

  try {
    await client.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_KEY]);

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const applied = await client.query<{ filename: string }>('SELECT filename FROM schema_migrations');
    const alreadyApplied = new Set(applied.rows.map((row) => row.filename));

    const files = (await readdir(dir))
      .filter((filename) => filename.endsWith('.sql'))
      .sort();

    for (const filename of files) {
      if (alreadyApplied.has(filename)) continue;

      const sql = await readFile(path.join(dir, filename), 'utf8');
      log?.info(`[migrate] applying ${filename}`);

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${filename} failed: ${(err as Error).message}`, { cause: err });
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_KEY]);
    client.release();
  }
}
