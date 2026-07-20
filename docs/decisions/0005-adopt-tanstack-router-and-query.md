# ADR 0005: Adopt TanStack Router and TanStack Query

**Status:** Accepted

## Context
The frontend was a single `App.tsx` that conditionally rendered panels
(`LoginPanel`/`SignedInPanel`/`RosterPanel`/`HealthPanel`) — no router, no
distinct URLs, one page. Server state was fetched by hand: `AuthContext`,
`HealthPanel`, and `RosterPanel` each rolled their own
`loading`/`error`/`useEffect` triad, `HealthPanel` bypassed the shared
`apiFetch` wrapper entirely, and `RosterPanel` mutated its player list with
manual array splice/sort after every add/delete instead of refetching.
A frontend audit (2026-07-19) flagged this duplication, plus `apiFetch`
discarding the backend's actual validation error text in favor of a generic
`"POST /api/players failed: 400"` message.

Separately, `ROADMAP.md` is almost entirely server-state CRUD across several
distinct feature areas — player roster, event calendar, RSVP responses/
headcounts, season fees/balances/reminders — several of which want their own
URL (a calendar view, a money view) rather than another panel bolted onto one
page. The RSVP feature in particular is specified as a **login-less shared
link** (`players respond via a shared link, no login required`), which is a
route with different auth semantics than the manager admin pages — something
a single conditionally-rendered page structurally can't express. The
developer wants the app rebuilt as a proper multi-page SPA with top
navigation (`PlayersPage`, `CalendarPage`, …) ahead of that work landing.

## Decision
Adopt **TanStack Query** for all server state, and **TanStack Router** for
client-side routing and page structure, together in one pass:

- **TanStack Query** replaces every hand-rolled fetch effect. `me`,
  `players`, and `health` become `queryOptions` (`src/api/queries.ts`);
  create/delete/logout become `useMutation`s (`src/api/mutations.ts`) that
  invalidate the relevant query instead of manually patching local state.
  `apiFetch` (`src/api/client.ts`) is extended to read a JSON `{ error }`
  body on non-2xx responses and throw that message, so Query's error state
  now surfaces real backend validation text — folding the audit's error-
  swallowing finding into this change rather than fixing it separately.
- **TanStack Router**, code-based (not file-based): a `RootLayout` supplies
  top nav and an `<Outlet/>`; `/players` and `/calendar` are protected pages,
  `/login` is public, `/` redirects to `/players`. Route protection uses
  `beforeLoad` + `queryClient.ensureQueryData(meQueryOptions)`, so the auth
  check and the auth data fetch are the same call instead of two separate
  mechanisms.
- Code-based routing (route tree defined in `src/router.tsx`, no
  `routeTree.gen.ts` codegen or Vite router plugin) is chosen over
  file-based for a handful of routes; revisit if the route count grows enough
  that file-based's colocation benefit outweighs the extra build step.
- `AppNav` uses the existing shadcn `Button` (`asChild` wrapping TanStack
  Router's `<Link>`) rather than a new nav component — no new shadcn
  primitive needed for two links.
- `CalendarPage` ships now as a routing placeholder only; the actual
  Calendar feature still needs its own `docs/specs/` entry before it's built,
  per `CLAUDE.md`. The `/rsvp/:token` shared-link route is designed for by
  this decision but not built until that roadmap item starts.

## Consequences
- Server state must go through a Query hook (`useQuery`/`useMutation` in
  `src/api/`), not a raw `useEffect` + `fetch`/`apiFetch` — new project
  convention (see `CLAUDE.md`).
- New features get their own route/page in `src/pages/` + `src/router.tsx`
  instead of another panel in a single file; `App.tsx` no longer exists —
  its layout role moves to `RootLayout`.
- `AuthContext` is removed; auth state is just the `me` query, read via a
  thin `useAuth()` wrapper. Logout is a mutation that updates the `me` cache
  directly rather than local component state.
- Two more runtime dependencies (`@tanstack/react-router`,
  `@tanstack/react-query`, plus dev-only `@tanstack/react-query-devtools`) —
  a deliberate trade against the audit's other finding that dependencies
  should stay minimal, justified by how much roadmap surface is server-state
  CRUD.
- Code-based routing means no generated route tree file to keep in sync, but
  also no automatic route-file colocation; route registration is manual in
  `router.tsx`.
- Protected routes now depend on the `me` query resolving before render
  (`ensureQueryData` in `beforeLoad`), so an unauthenticated visit to a
  protected URL redirects before the page mounts, rather than mounting and
  then conditionally rendering a login panel as before.
