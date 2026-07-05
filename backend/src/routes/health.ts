import type { FastifyInstance } from 'fastify';
import { pool } from '../db.js';

export async function healthRoute(app: FastifyInstance) {
  app.get('/api/health', async (_req, reply) => {
    try {
      await pool.query('SELECT 1');
      return reply.send({ db: 'ok', serverTime: new Date().toISOString() });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ db: 'error', serverTime: new Date().toISOString() });
    }
  });
}
