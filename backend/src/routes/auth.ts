import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import oauthPlugin, { type OAuth2Namespace } from '@fastify/oauth2';
import { pool } from '../db.js';
import { SESSION_COOKIE_NAME, sessionCookieOptions } from '../auth/plugin.js';

declare module 'fastify' {
  interface FastifyInstance {
    googleOAuth2: OAuth2Namespace;
  }
}

type GoogleUserInfo = {
  id: string;
  email: string;
  verified_email: boolean;
  name?: string;
};

/**
 * Google login + session routes. See docs/specs/manager-auth.md and
 * ADR 0003 for the full flow: Google verifies identity, the `users` table
 * is the actual access-control allowlist, and a successful login issues our
 * own JWT session cookie.
 */
export async function authRoute(app: FastifyInstance) {
  const callbackUri =
    process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:5173/api/auth/google/callback';

  app.register(oauthPlugin, {
    name: 'googleOAuth2',
    scope: ['openid', 'email', 'profile'],
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID ?? '',
        secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      },
      // Mirrors @fastify/oauth2's built-in GOOGLE_CONFIGURATION constant,
      // spelled out because the package's `export =` typings don't expose
      // its static provider-config properties to TS consumers.
      auth: {
        authorizeHost: 'https://accounts.google.com',
        authorizePath: '/o/oauth2/v2/auth',
        tokenHost: 'https://www.googleapis.com',
        tokenPath: '/oauth2/v4/token',
      },
    },
    startRedirectPath: '/api/auth/google',
    callbackUri,
  });

  app.get(
    '/api/auth/google/callback',
    async function (this: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
      let accessToken: string;
      try {
        const { token } = await this.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
        accessToken = token.access_token;
      } catch (err) {
        app.log.error(err, 'Google OAuth code exchange failed');
        return reply.redirect('/?error=oauth_failed');
      }

      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!userInfoRes.ok) {
        app.log.error({ status: userInfoRes.status }, 'Failed to fetch Google userinfo');
        return reply.redirect('/?error=oauth_failed');
      }
      const googleUser = (await userInfoRes.json()) as GoogleUserInfo;

      if (!googleUser.verified_email) {
        return reply.redirect('/?error=denied');
      }

      // The allowlist is the real access-control boundary: Google verified
      // this person's identity, but that alone doesn't grant access.
      const { rows } = await pool.query<{ id: number; email: string }>(
        'SELECT id, email FROM users WHERE email = $1',
        [googleUser.email],
      );
      if (rows.length === 0) {
        return reply.redirect('/?error=denied');
      }

      await pool.query('UPDATE users SET google_sub = $1, name = $2 WHERE email = $3', [
        googleUser.id,
        googleUser.name ?? null,
        googleUser.email,
      ]);

      const sessionToken = await reply.jwtSign({ email: googleUser.email });
      reply.setCookie(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions());
      return reply.redirect('/');
    },
  );

  app.post('/api/logout', async (_request, reply) => {
    reply.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions());
    return reply.send({ ok: true });
  });

  // Public: lets the frontend check session state on load without itself
  // requiring a session.
  app.get('/api/me', async (request, reply) => {
    try {
      await request.jwtVerify();
      return reply.send({ authenticated: true, email: request.user.email });
    } catch {
      return reply.send({ authenticated: false });
    }
  });

  // Placeholder protected route proving the guard works end-to-end. Future
  // admin routes (e.g. the player roster) attach the same guard:
  // `{ preHandler: app.authenticate }`.
  app.get('/api/whoami', { preHandler: app.authenticate }, async (request, reply) => {
    return reply.send({ email: request.user.email });
  });
}
