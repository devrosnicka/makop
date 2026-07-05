import Fastify from 'fastify';
import staticPlugin from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { healthRoute } from './routes/health.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = Fastify({ logger: true });

// In production the frontend is built into ../frontend/dist and copied
// alongside this file at container build time (see backend/Dockerfile).
// In dev, the Vite dev server handles the frontend and proxies /api here,
// so this static root simply won't exist — @fastify/static tolerates that.
app.register(staticPlugin, {
  root: join(__dirname, '../frontend/dist'),
  prefix: '/',
});

app.register(healthRoute);

const PORT = Number(process.env.PORT ?? 3000);

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
