import type { FastifyInstance } from 'fastify';
import { pool } from '../db.js';

export const PLAYER_POSITIONS = ['defender', 'goalkeeper', 'attacker'] as const;
export type PlayerPosition = (typeof PLAYER_POSITIONS)[number];

export type Player = {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  jersey_number: number | null;
  positions: PlayerPosition[];
  notes: string | null;
  created_at: string;
};

type CreatePlayerBody = {
  first_name?: unknown;
  last_name?: unknown;
  email?: unknown;
  phone?: unknown;
  jersey_number?: unknown;
  positions?: unknown;
  notes?: unknown;
};

// Empty strings are treated as "not provided" so the frontend can send a form
// with blank optional fields without those becoming empty-string DB values.
function optionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isPlayerPosition(value: unknown): value is PlayerPosition {
  return typeof value === 'string' && (PLAYER_POSITIONS as readonly string[]).includes(value);
}

/**
 * Player roster routes. See docs/specs/player-roster.md and ADR 0003 — this
 * is the feature manager auth was built to gate, so every route here attaches
 * the shared `authenticate` guard (same pattern as `/api/whoami`).
 */
export async function playersRoute(app: FastifyInstance) {
  app.get('/api/players', { preHandler: app.authenticate }, async (_request, reply) => {
    const { rows } = await pool.query<Player>(
      'SELECT * FROM players ORDER BY jersey_number NULLS LAST, last_name, first_name',
    );
    return reply.send({ players: rows });
  });

  app.post('/api/players', { preHandler: app.authenticate }, async (request, reply) => {
    const body = request.body as CreatePlayerBody;
    const firstName = typeof body.first_name === 'string' ? body.first_name.trim() : '';
    const lastName = typeof body.last_name === 'string' ? body.last_name.trim() : '';
    if (firstName.length === 0 || lastName.length === 0) {
      return reply.status(400).send({ error: 'first_name and last_name are required' });
    }

    let jerseyNumber: number | null = null;
    if (body.jersey_number !== undefined && body.jersey_number !== null && body.jersey_number !== '') {
      const parsed = Number(body.jersey_number);
      if (!Number.isInteger(parsed)) {
        return reply.status(400).send({ error: 'jersey_number must be an integer' });
      }
      jerseyNumber = parsed;
    }

    let positions: PlayerPosition[] = [];
    if (body.positions !== undefined) {
      if (!Array.isArray(body.positions) || !body.positions.every(isPlayerPosition)) {
        return reply.status(400).send({
          error: `positions must be an array of: ${PLAYER_POSITIONS.join(', ')}`,
        });
      }
      positions = [...new Set(body.positions)];
    }

    const { rows } = await pool.query<Player>(
      `INSERT INTO players (first_name, last_name, email, phone, jersey_number, positions, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        firstName,
        lastName,
        optionalText(body.email),
        optionalText(body.phone),
        jerseyNumber,
        positions,
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
