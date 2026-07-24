import Fastify from 'fastify';
import staticPlugin from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { healthRoute } from './routes/health.js';
import authPlugin from './auth/plugin.js';
import { authRoute } from './routes/auth.js';
import { playersRoute } from './routes/players.js';
import { runMigrations } from './migrate.js';

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
// Session/cookie support + the `authenticate` guard must be registered
// before any route that uses it (see backend/src/auth/plugin.ts).
app.register(authPlugin);
app.register(authRoute);
app.register(playersRoute);

// @fastify/static only serves requests that match a real file under
// frontend/dist; anything else (e.g. a client-side route like /players
// hit via direct navigation or a refresh) falls through to here. Unmatched
// API routes stay a JSON 404; everything else gets index.html so TanStack
// Router can take over client-side, same as the Vite dev server's built-in
// SPA fallback already does in dev.
app.setNotFoundHandler((request, reply) => {
  if (request.raw.url?.startsWith('/api/')) {
    reply.code(404).send({
      message: `Route ${request.method}:${request.raw.url} not found`,
      error: 'Not Found',
      statusCode: 404,
    });
    return;
  }
  reply.sendFile('index.html');
});

const PORT = Number(process.env.PORT ?? 3000);

try {
  // Converges the DB schema to match this build's expectations before
  // accepting traffic — see db/migrations/README.md. Runs against a fresh
  // volume and an already-initialized one (e.g. production) alike.
  await runMigrations(app.log);
  await app.listen({ port: PORT, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
