// One-off CLI to seed the manager-auth allowlist (see docs/specs/manager-auth.md,
// ADR 0003). Google verifies identity; this script is how an email becomes
// eligible to actually log in.
//
// Usage: npm run add-allowed-user -- <email> [name]

import { pool } from '../src/db.js';

async function main() {
  const [email, name] = process.argv.slice(2);

  if (!email || !email.includes('@')) {
    console.error('Usage: npm run add-allowed-user -- <email> [name]');
    process.exitCode = 1;
    return;
  }

  const { rows } = await pool.query<{ id: number; email: string }>(
    `INSERT INTO users (email, name)
     VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET name = COALESCE(EXCLUDED.name, users.name)
     RETURNING id, email`,
    [email, name ?? null],
  );

  console.log(`Allowlisted: ${rows[0].email} (id ${rows[0].id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
