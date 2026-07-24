import type { FastifyInstance } from 'fastify';
import { pool } from '../db.js';

export const EVENT_TYPES = ['friendly_match', 'league_match', 'custom'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type MakopEvent = {
  id: number;
  event_type: EventType;
  title: string | null;
  event_date: string;
  start_time: string | null;
  address: string | null;
  description: string | null;
  created_at: string;
};

type CreateEventBody = {
  event_type?: unknown;
  title?: unknown;
  event_date?: unknown;
  start_time?: unknown;
  address?: unknown;
  description?: unknown;
};

// Empty strings are treated as "not provided" so the frontend can send a form
// with blank optional fields without those becoming empty-string DB values.
function optionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isEventType(value: unknown): value is EventType {
  return typeof value === 'string' && (EVENT_TYPES as readonly string[]).includes(value);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

/**
 * Event calendar routes. See docs/specs/events-calendar.md — gated by the
 * same manager auth guard as the player roster (docs/decisions/0003).
 */
export async function eventsRoute(app: FastifyInstance) {
  app.get('/api/events', { preHandler: app.authenticate }, async (_request, reply) => {
    const { rows } = await pool.query<MakopEvent>(
      'SELECT * FROM events ORDER BY event_date, start_time NULLS FIRST',
    );
    return reply.send({ events: rows });
  });

  app.post('/api/events', { preHandler: app.authenticate }, async (request, reply) => {
    const body = request.body as CreateEventBody;

    if (!isEventType(body.event_type)) {
      return reply.status(400).send({ error: `event_type must be one of: ${EVENT_TYPES.join(', ')}` });
    }

    const eventDate = typeof body.event_date === 'string' ? body.event_date.trim() : '';
    if (!DATE_RE.test(eventDate)) {
      return reply.status(400).send({ error: 'event_date is required and must be in YYYY-MM-DD format' });
    }

    let startTime: string | null = null;
    if (typeof body.start_time === 'string' && body.start_time.trim().length > 0) {
      const trimmed = body.start_time.trim();
      if (!TIME_RE.test(trimmed)) {
        return reply.status(400).send({ error: 'start_time must be in HH:MM format' });
      }
      startTime = trimmed;
    }

    const { rows } = await pool.query<MakopEvent>(
      `INSERT INTO events (event_type, title, event_date, start_time, address, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        body.event_type,
        optionalText(body.title),
        eventDate,
        startTime,
        optionalText(body.address),
        optionalText(body.description),
      ],
    );
    return reply.status(201).send(rows[0]);
  });
}
