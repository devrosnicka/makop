import fp from 'fastify-plugin';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import type { CookieSerializeOptions } from '@fastify/cookie';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

// The name of the cookie that carries the session JWT.
export const SESSION_COOKIE_NAME = 'makop_session';

declare module 'fastify' {
  interface FastifyInstance {
    // Attach as a preHandler on any route that requires a signed-in manager.
    // 401s the request if there's no valid session; otherwise populates
    // request.user from the JWT payload.
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { email: string };
    user: { email: string };
  }
}

// Shared cookie attributes for both setting and clearing the session cookie.
// See docs/decisions/0003-manager-authentication.md — httpOnly + SameSite=strict
// keeps the JWT out of JS reach and off cross-site requests; secure is only
// disabled in dev because localhost isn't served over HTTPS.
export function sessionCookieOptions(): CookieSerializeOptions {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  };
}

/**
 * Registers session support (cookie parsing + JWT signing/verification) and
 * decorates the instance with an `authenticate` guard. Every protected route
 * (this feature's /api/whoami, and future admin routes like the player
 * roster) attaches `{ preHandler: app.authenticate }`.
 */
export default fp(async function authPlugin(app: FastifyInstance) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production');
    }
    app.log.warn(
      'JWT_SECRET not set — using an insecure development default. Set it before deploying.',
    );
  }

  await app.register(cookie);
  await app.register(jwt, {
    secret: jwtSecret ?? 'dev-insecure-secret-change-me',
    cookie: {
      cookieName: SESSION_COOKIE_NAME,
      signed: false,
    },
  });

  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });
});
