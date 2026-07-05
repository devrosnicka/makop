# Feature: Manager authentication (Google login)

## Why
makop currently has no authentication at all, and runs publicly at
`makop.tomaskrizek.cz`. The next planned feature (player roster) will store
personal contact details, so before any admin-facing, PII-bearing feature
ships, the admin surface needs to be gated. See
[ADR 0003](../decisions/0003-manager-authentication.md) for the full
rationale and trade-offs — this spec covers the concrete build.

## User stories & acceptance criteria
- As the manager, I want to sign in with my Google account, so that I don't
  need to manage a separate password for makop.
- As the manager, I want unauthenticated requests to admin routes rejected,
  so that the admin surface can't be reached without logging in.
- As the app owner, I want only pre-approved emails to be able to log in, so
  that any Google account can't reach the admin surface just because Google
  verified it.

Acceptance criteria:
- [ ] `GET /api/whoami` (placeholder protected route) returns 401 with no
      session cookie.
- [ ] Clicking "Sign in with Google" and completing consent with an
      **allowlisted** email results in an httpOnly session cookie and
      `GET /api/whoami` succeeding.
- [ ] Completing Google consent with a **non-allowlisted** email results in
      no session being issued and a visible rejection in the UI.
- [ ] `POST /api/logout` clears the session; `GET /api/whoami` returns 401
      again afterward.
- [ ] `GET /api/me` reflects session state (`authenticated: true/false`)
      without itself requiring auth.
- [ ] `/api/health` remains public (unaffected by the auth gate).
- [ ] Backend and frontend both build cleanly (`npm run build`).

## Scope
**In scope:**
- Google OAuth login/logout flow, session cookie, `authenticate` guard
  reusable by future routes.
- `users` table as an email allowlist (no passwords).
- CLI script to seed allowlisted emails.
- Minimal frontend: sign-in button, logged-in state, logout — no routing.

**Out of scope:**
- Player roster or any other protected feature (comes later, reuses the
  guard built here).
- Self-service signup/invite flow (allowlist is seeded manually for now).
- Password-based login (may be added later per ADR 0003 if ever needed).

## Technical approach
- Key files/modules touched: `db/init.sql`, `backend/src/auth/plugin.ts`
  (new), `backend/src/routes/auth.ts` (new), `backend/src/server.ts`,
  `backend/src/scripts/add-allowed-user.ts` (new — compiled into
  `dist/scripts/` alongside the server, so it also runs in the production
  image via `npm run add-allowed-user:prod`), `frontend/src/api/client.ts`
  (new), `frontend/src/auth/AuthContext.tsx` (new), `frontend/src/App.tsx`.
- Existing utilities/patterns to reuse: routes follow the self-prefixed
  `/api/...` convention and shared `pool` import from `backend/src/routes/health.ts`;
  no ORM, raw parameterized SQL, matching ADR 0001.
- Notable trade-offs or open questions: stateless JWT session means no
  server-side revocation short of rotating `JWT_SECRET` — acceptable for a
  single-manager tool; revisit if multi-manager/session-revocation needs grow.
- **Deploy caveat (bit us once already):** `db/init.sql` only runs when
  Postgres initializes a *fresh, empty* volume — it does **not** apply to an
  already-initialized database. Every schema change in this feature (and
  every future one, e.g. the player roster's `players` table) needs its
  `CREATE TABLE`/`ALTER TABLE` statements run by hand against any environment
  whose volume predates the change (in practice: production). No migration
  tool exists yet (per ADR 0001) to automate this.

### One-time external setup (manual, per environment)
1. Create a Google Cloud project.
2. Configure the OAuth consent screen — keep it in **Testing** mode and add
   allowed test users (skips Google's app-verification process).
3. Create OAuth 2.0 credentials (Web application) → obtain **Client ID** and
   **Client Secret**.
4. Register authorized redirect URIs:
   - dev: `http://localhost:5173/api/auth/google/callback`
   - prod: `https://makop.tomaskrizek.cz/api/auth/google/callback`
5. Provide `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, and the
   app base/callback URL as env vars in dev, prod compose, and GitHub Actions
   deploy secrets.

## Verification
How we'll prove this works end-to-end (not just "tests pass"):
- [ ] `docker compose down -v && docker compose up --build` (fresh volume so
      `init.sql` creates the `users` table).
- [ ] `npm run add-allowed-user -- manager@example.com` seeds the allowlist.
- [ ] `curl -i localhost:5173/api/whoami` → 401 with no cookie.
- [ ] Sign in with Google (allowlisted email) via the UI → redirected back,
      `/api/me` shows `authenticated: true`, `/api/whoami` succeeds with the
      cookie.
- [ ] Sign in with Google (non-allowlisted email) → rejected, no session.
- [ ] Logout via the UI → `/api/me` shows `authenticated: false`,
      `/api/whoami` is 401 again.
- [ ] `cd backend && npm run build` and `cd frontend && npm run build` both
      clean.
