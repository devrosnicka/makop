import type { FastifyInstance } from 'fastify';
import type { PoolClient } from 'pg';
import { pool } from '../db.js';

export const RECEIVABLE_STATUSES = ['pending', 'partially_paid', 'paid', 'cancelled'] as const;
export type ReceivableStatus = (typeof RECEIVABLE_STATUSES)[number];

export const RECEIVABLE_SOURCE_TYPES = ['season', 'jersey', 'friendly_match', 'manual'] as const;
export type ReceivableSourceType = (typeof RECEIVABLE_SOURCE_TYPES)[number];

export type Receivable = {
  id: number;
  player_id: number;
  title: string;
  description: string | null;
  amount: number;
  due_date: string | null;
  status: ReceivableStatus;
  source_type: ReceivableSourceType;
  source_id: number | null;
  created_at: string;
};

export type Payment = {
  id: number;
  receivable_id: number;
  amount: number;
  paid_at: string;
  note: string | null;
  created_at: string;
};

// The list/detail shape: the raw row plus who owes it and how much of it is
// already covered. `remaining` is left to the frontend (amount - paid_total),
// which also decides how to present an overpayment.
type ReceivableListItem = Receivable & {
  player_name: string;
  paid_total: number;
};

type Debtor = {
  player_id: number;
  first_name: string;
  last_name: string;
  receivable_count: number;
  outstanding: number;
  oldest_due_date: string | null;
};

type CreateReceivableBody = {
  player_id?: unknown;
  title?: unknown;
  description?: unknown;
  amount?: unknown;
  due_date?: unknown;
  source_type?: unknown;
  source_id?: unknown;
};

type CreatePaymentBody = {
  amount?: unknown;
  paid_at?: unknown;
  note?: unknown;
};

// Empty strings are treated as "not provided" so the frontend can send a form
// with blank optional fields without those becoming empty-string DB values
// (same helper as routes/players.ts and routes/events.ts).
function optionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// Amounts are whole CZK and a zero-crown debt or payment is meaningless, so
// this is the strictly-positive sibling of the `wholeNonNegative` parser in
// routes/seasons.ts. Accepts the numeric strings a form sends.
function wholePositive(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function optionalDate(value: unknown): { ok: true; value: string | null } | { ok: false } {
  const text = optionalText(value);
  if (text === null) return { ok: true, value: null };
  if (!DATE_RE.test(text)) return { ok: false };
  return { ok: true, value: text };
}

// Every read of a receivable joins its player and its payment sum. SUM() is a
// bigint, which pg would hand back as a string — the ::int casts keep the JSON
// numeric.
const LIST_SELECT = `
  SELECT r.*,
         p.first_name || ' ' || p.last_name AS player_name,
         COALESCE(pay.paid_total, 0) AS paid_total
    FROM receivables r
    JOIN players p ON p.id = r.player_id
    LEFT JOIN (
      SELECT receivable_id, SUM(amount)::int AS paid_total
        FROM payments GROUP BY receivable_id
    ) pay ON pay.receivable_id = r.id`;

/**
 * Recomputes a receivable's status from the sum of its payments (AC4). Always
 * called on the same client, inside the same transaction as the payment insert
 * or delete that triggered it — status must never drift from the payments.
 *
 * `cancelled` is sticky: a cancelled receivable stays cancelled regardless of
 * what was ever paid against it (and no new payments are accepted on one).
 */
async function recalculateStatus(client: PoolClient, receivableId: number): Promise<Receivable> {
  const { rows } = await client.query<Receivable>(
    `UPDATE receivables r
        SET status = CASE
              WHEN r.status = 'cancelled'   THEN 'cancelled'
              WHEN s.paid_total >= r.amount THEN 'paid'
              WHEN s.paid_total > 0         THEN 'partially_paid'
              ELSE 'pending'
            END
       FROM (
         SELECT COALESCE(SUM(amount), 0) AS paid_total
           FROM payments WHERE receivable_id = $1
       ) s
      WHERE r.id = $1
      RETURNING r.*`,
    [receivableId],
  );
  return rows[0];
}

/**
 * Receivables routes — the generic "player owes the team X" module (see
 * docs/specs/receivables.md), gated by the same manager auth guard as the rest
 * of the app (ADR 0003).
 *
 * A receivable is never edited after creation: correcting one means cancelling
 * it (or deleting it while it has no payments) and creating a new one. Only
 * its status changes, and only via recalculateStatus() above.
 */
export async function receivablesRoute(app: FastifyInstance) {
  app.get<{ Querystring: { status?: string; player_id?: string } }>(
    '/api/receivables',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const conditions: string[] = [];
      const params: unknown[] = [];

      // `open` is the default view of the list: everything still owed.
      const status = request.query.status;
      if (status === 'open') {
        conditions.push(`r.status IN ('pending', 'partially_paid')`);
      } else if (status !== undefined && status !== 'all') {
        if (!(RECEIVABLE_STATUSES as readonly string[]).includes(status)) {
          return reply.status(400).send({
            error: `status must be one of: ${RECEIVABLE_STATUSES.join(', ')}, open, all`,
          });
        }
        params.push(status);
        conditions.push(`r.status = $${params.length}`);
      }

      if (request.query.player_id !== undefined) {
        const playerId = Number(request.query.player_id);
        if (!Number.isInteger(playerId)) {
          return reply.status(400).send({ error: 'invalid player id' });
        }
        params.push(playerId);
        conditions.push(`r.player_id = $${params.length}`);
      }

      const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
      const { rows } = await pool.query<ReceivableListItem>(
        // Soonest due first, undated last, newest first within a due date.
        `${LIST_SELECT}${where} ORDER BY r.due_date NULLS LAST, r.id DESC`,
        params,
      );
      return reply.send({ receivables: rows });
    },
  );

  app.post('/api/receivables', { preHandler: app.authenticate }, async (request, reply) => {
    const body = request.body as CreateReceivableBody;

    const playerId = Number(body.player_id);
    if (!Number.isInteger(playerId)) {
      return reply.status(400).send({ error: 'player_id is required' });
    }

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (title.length === 0) {
      return reply.status(400).send({ error: 'title is required' });
    }

    const amount = wholePositive(body.amount);
    if (amount === null) {
      return reply.status(400).send({ error: 'amount must be a whole number of CZK above zero' });
    }

    const dueDate = optionalDate(body.due_date);
    if (!dueDate.ok) {
      return reply.status(400).send({ error: 'due_date must be in YYYY-MM-DD format' });
    }

    // Manually created receivables default to 'manual'; the other source types
    // are accepted so a future in-app source can post here directly.
    const sourceType = body.source_type === undefined ? 'manual' : body.source_type;
    if (!(RECEIVABLE_SOURCE_TYPES as readonly unknown[]).includes(sourceType)) {
      return reply.status(400).send({
        error: `source_type must be one of: ${RECEIVABLE_SOURCE_TYPES.join(', ')}`,
      });
    }

    const { rows: players } = await pool.query<{ id: number }>(
      'SELECT id FROM players WHERE id = $1',
      [playerId],
    );
    if (players.length === 0) {
      return reply.status(400).send({ error: 'unknown player' });
    }

    const { rows } = await pool.query<Receivable>(
      `INSERT INTO receivables (player_id, title, description, amount, due_date, source_type, source_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        playerId,
        title,
        optionalText(body.description),
        amount,
        dueDate.value,
        sourceType,
        body.source_id === undefined || body.source_id === null || body.source_id === ''
          ? null
          : Number(body.source_id),
      ],
    );
    return reply.status(201).send(rows[0]);
  });

  app.get<{ Params: { id: string } }>(
    '/api/receivables/:id',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const id = Number(request.params.id);
      if (!Number.isInteger(id)) {
        return reply.status(400).send({ error: 'invalid receivable id' });
      }

      const { rows } = await pool.query<ReceivableListItem>(`${LIST_SELECT} WHERE r.id = $1`, [id]);
      const receivable = rows[0];
      if (!receivable) {
        return reply.status(404).send({ error: 'receivable not found' });
      }

      const { rows: payments } = await pool.query<Payment>(
        'SELECT * FROM payments WHERE receivable_id = $1 ORDER BY paid_at, id',
        [id],
      );
      return reply.send({ receivable, payments });
    },
  );

  app.post<{ Params: { id: string } }>(
    '/api/receivables/:id/payments',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const id = Number(request.params.id);
      if (!Number.isInteger(id)) {
        return reply.status(400).send({ error: 'invalid receivable id' });
      }

      const body = request.body as CreatePaymentBody;
      const amount = wholePositive(body.amount);
      if (amount === null) {
        return reply.status(400).send({ error: 'amount must be a whole number of CZK above zero' });
      }

      const paidAt = optionalDate(body.paid_at);
      if (!paidAt.ok || paidAt.value === null) {
        return reply.status(400).send({ error: 'paid_at is required and must be in YYYY-MM-DD format' });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // FOR UPDATE so two concurrent payments can't both read a stale sum and
        // leave the status behind the payments.
        const { rows: existing } = await client.query<Receivable>(
          'SELECT * FROM receivables WHERE id = $1 FOR UPDATE',
          [id],
        );
        const receivable = existing[0];
        if (!receivable) {
          await client.query('ROLLBACK');
          return reply.status(404).send({ error: 'receivable not found' });
        }
        if (receivable.status === 'cancelled') {
          await client.query('ROLLBACK');
          return reply.status(409).send({ error: 'this receivable is cancelled' });
        }

        const { rows: created } = await client.query<Payment>(
          `INSERT INTO payments (receivable_id, amount, paid_at, note)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [id, amount, paidAt.value, optionalText(body.note)],
        );

        const updated = await recalculateStatus(client, id);
        await client.query('COMMIT');
        return reply.status(201).send({ payment: created[0], receivable: updated });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },
  );

  app.delete<{ Params: { id: string; paymentId: string } }>(
    '/api/receivables/:id/payments/:paymentId',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const id = Number(request.params.id);
      const paymentId = Number(request.params.paymentId);
      if (!Number.isInteger(id) || !Number.isInteger(paymentId)) {
        return reply.status(400).send({ error: 'invalid id' });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const { rows: existing } = await client.query<Receivable>(
          'SELECT * FROM receivables WHERE id = $1 FOR UPDATE',
          [id],
        );
        if (existing.length === 0) {
          await client.query('ROLLBACK');
          return reply.status(404).send({ error: 'receivable not found' });
        }

        const { rowCount } = await client.query(
          'DELETE FROM payments WHERE id = $1 AND receivable_id = $2',
          [paymentId, id],
        );
        if (rowCount === 0) {
          await client.query('ROLLBACK');
          return reply.status(404).send({ error: 'payment not found' });
        }

        // Removing a payment walks the status back down just as adding one
        // walks it up — paid -> partially_paid -> pending.
        const updated = await recalculateStatus(client, id);
        await client.query('COMMIT');
        return reply.send({ receivable: updated });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    '/api/receivables/:id/cancel',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const id = Number(request.params.id);
      if (!Number.isInteger(id)) {
        return reply.status(400).send({ error: 'invalid receivable id' });
      }

      const { rows: existing } = await pool.query<Receivable>(
        'SELECT * FROM receivables WHERE id = $1',
        [id],
      );
      const receivable = existing[0];
      if (!receivable) {
        return reply.status(404).send({ error: 'receivable not found' });
      }

      // Cancelling something that was partly paid would hide real money, so
      // the payments have to be removed first.
      const { rows: payments } = await pool.query<{ count: string }>(
        'SELECT COUNT(*) AS count FROM payments WHERE receivable_id = $1',
        [id],
      );
      if (Number(payments[0].count) > 0) {
        return reply.status(409).send({
          error: 'this receivable already has payments — delete them before cancelling it',
        });
      }

      const { rows } = await pool.query<Receivable>(
        `UPDATE receivables SET status = 'cancelled' WHERE id = $1 RETURNING *`,
        [id],
      );
      return reply.send(rows[0]);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/receivables/:id',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const id = Number(request.params.id);
      if (!Number.isInteger(id)) {
        return reply.status(400).send({ error: 'invalid receivable id' });
      }

      // Deleting is only for a receivable created by mistake. Once money has
      // been recorded against it, cancelling is the honest option — that keeps
      // the payment history instead of cascading it away.
      const { rows: payments } = await pool.query<{ count: string }>(
        'SELECT COUNT(*) AS count FROM payments WHERE receivable_id = $1',
        [id],
      );
      if (Number(payments[0].count) > 0) {
        return reply.status(409).send({
          error: 'this receivable has payments — cancel it instead of deleting it',
        });
      }

      const { rowCount } = await pool.query('DELETE FROM receivables WHERE id = $1', [id]);
      if (rowCount === 0) {
        return reply.status(404).send({ error: 'receivable not found' });
      }
      return reply.status(204).send();
    },
  );

  // The debtor list (AC5): one row per player with anything still owed, across
  // every source. Cancelled and fully paid receivables drop out.
  app.get('/api/debtors', { preHandler: app.authenticate }, async (_request, reply) => {
    const { rows } = await pool.query<Debtor>(
      `SELECT p.id AS player_id,
              p.first_name,
              p.last_name,
              COUNT(*)::int AS receivable_count,
              SUM(r.amount - COALESCE(pay.paid_total, 0))::int AS outstanding,
              MIN(r.due_date) AS oldest_due_date
         FROM receivables r
         JOIN players p ON p.id = r.player_id
         LEFT JOIN (
           SELECT receivable_id, SUM(amount)::int AS paid_total
             FROM payments GROUP BY receivable_id
         ) pay ON pay.receivable_id = r.id
        WHERE r.status IN ('pending', 'partially_paid')
        GROUP BY p.id, p.first_name, p.last_name
        ORDER BY outstanding DESC, p.last_name, p.first_name`,
    );
    return reply.send({ debtors: rows });
  });
}
