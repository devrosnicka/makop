import type { FastifyInstance } from 'fastify';
import { pool } from '../db.js';

export type Player = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  jersey_number: number | null;
  position: string | null;
  notes: string | null;
  created_at: string;
};

type CreatePlayerBody = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  jersey_number?: unknown;
  position?: unknown;
  notes?: unknown;
};

// Empty strings are treated as "not provided" so the frontend can send a form
// with blank optional fields without those becoming empty-string DB values.
function optionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Player roster routes. See docs/specs/player-roster.md and ADR 0003 — this
 * is the feature manager auth was built to gate, so every route here attaches
 * the shared `authenticate` guard (same pattern as `/api/whoami`).
 */
export async function playersRoute(app: FastifyInstance) {
  app.get('/api/players', { preHandler: app.authenticate }, async (_request, reply) => {
    const { rows } = await pool.query<Player>('SELECT * FROM players ORDER BY name');
    return reply.send({ players: rows });
  });

  app.post('/api/players', { preHandler: app.authenticate }, async (request, reply) => {
    const body = request.body as CreatePlayerBody;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (name.length === 0) {
      return reply.status(400).send({ error: 'name is required' });
    }

    let jerseyNumber: number | null = null;
    if (body.jersey_number !== undefined && body.jersey_number !== null && body.jersey_number !== '') {
      const parsed = Number(body.jersey_number);
      if (!Number.isInteger(parsed)) {
        return reply.status(400).send({ error: 'jersey_number must be an integer' });
      }
      jerseyNumber = parsed;
    }

    const { rows } = await pool.query<Player>(
      `INSERT INTO players (name, email, phone, jersey_number, position, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        name,
        optionalText(body.email),
        optionalText(body.phone),
        jerseyNumber,
        optionalText(body.position),
        optionalText(body.notes),
      ],
    );
    return reply.status(201).send(rows[0]);
  });

  app.delete<{ Params: { id: string } }>(
    '/api/players/:id',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const id = Number(request.params.id);
      if (!Number.isInteger(id)) {
        return reply.status(400).send({ error: 'invalid player id' });
      }

      const { rowCount } = await pool.query('DELETE FROM players WHERE id = $1', [id]);
      if (rowCount === 0) {
        return reply.status(404).send({ error: 'player not found' });
      }
      return reply.status(204).send();
    },
  );
}
