# ADR 0003: Manager authentication via Google login

**Status:** Accepted

## Context
ADR 0001 explicitly deferred auth: *"the manager-facing admin side will
eventually need auth — deferred to a future ADR/spec."* That moment has
arrived — the first real feature planned after this one, the player roster,
will store personal contact details (name, phone, email), and makop runs
publicly at `makop.tomaskrizek.cz` with no authentication anywhere in the
backend today. Shipping any PII-bearing admin feature before a gate exists
would expose it to anyone who finds the URL.

makop has exactly one admin user today (the manager), with no near-term need
for self-service signup, password resets, or multi-tenant accounts. Player-
facing features (RSVP) are intentionally login-less via shared links and stay
that way — this decision only concerns the manager/admin surface.

## Decision
Authenticate the manager via **Google login (OAuth 2.0 / OIDC)** instead of a
password:

- **Identity:** `@fastify/oauth2` drives the Google authorization-code flow.
  On callback, the verified Google email is looked up in a `users` table that
  acts as an **allowlist** — an email not already present is rejected, even
  though Google itself verified it. This is the actual access-control
  boundary: without it, any Google account could reach the admin surface.
- **Session:** after a successful, allowlisted login we issue our own
  stateless session — a JWT stored in an httpOnly, `SameSite=strict`,
  `Secure`-in-prod cookie (`@fastify/jwt` + `@fastify/cookie`). No server-side
  session store. Every protected route (the roster's routes and future
  admin routes) shares one `authenticate` preHandler guard.
- **No passwords stored anywhere** — `users` holds `email`, `google_sub`, and
  `name`, not a credential. Seeding the allowlist is a one-off CLI script
  (`backend/src/scripts/add-allowed-user.ts`), not a signup form. It's built
  alongside the server (`tsc` compiles everything under `src/`), so the same
  script runs via `tsx` in dev and via compiled `dist/` in production —
  `npm run add-allowed-user` vs. `npm run add-allowed-user:prod`.
- Google Cloud OAuth consent screen stays in **Testing** mode with an explicit
  list of allowed test users, avoiding Google's app-verification process for
  what is effectively a single-manager tool.

## Consequences
- The admin surface is gated before any PII-bearing feature (player roster,
  events, money) lands; those features simply attach the same `authenticate`
  guard rather than building their own.
- No password hashing, reset flows, or credential storage to maintain — Google
  owns identity verification; makop only owns the allowlist and the session.
- New external dependency: makop now relies on Google's OAuth service being
  reachable, and on a Google Cloud project that must be created and
  maintained outside this repo (console setup, redirect URIs, client
  secret/ID rotation).
- New secrets to provision per environment: `GOOGLE_CLIENT_ID`,
  `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, plus the callback/base URL — added to
  `docker-compose.yml`, `docker-compose.prod.yml`, and the GitHub Actions
  deploy workflow. Redirect URIs must be kept in sync per environment
  (`localhost:5173` in dev, `makop.tomaskrizek.cz` in prod).
- Adding a second manager later is a one-line `INSERT` via the CLI script, not
  a new signup flow — deliberately minimal until multi-manager needs grow
  beyond an allowlist.
