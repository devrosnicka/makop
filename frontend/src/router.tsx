import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, createRoute, createRouter, redirect } from '@tanstack/react-router';
import { queryClient } from './api/queryClient';
import {
  meQueryOptions,
  playersQueryOptions,
  eventsQueryOptions,
  seasonsQueryOptions,
  seasonDetailQueryOptions,
  receivablesQueryOptions,
  receivableDetailQueryOptions,
} from './api/queries';
import { RootLayout } from './components/layout/RootLayout';
import { LoginPage } from './pages/LoginPage';
import { PlayersPage } from './pages/PlayersPage';
import { NewPlayerPage } from './pages/NewPlayerPage';
import { PlayerDetailPage } from './pages/PlayerDetailPage';
import { CalendarPage } from './pages/CalendarPage';
import { NewEventPage } from './pages/NewEventPage';
import { SeasonsPage } from './pages/SeasonsPage';
import { NewSeasonPage } from './pages/NewSeasonPage';
import { SeasonDetailPage } from './pages/SeasonDetailPage';
import { NewSeasonCalculationPage } from './pages/NewSeasonCalculationPage';
import { ReceivablesPage } from './pages/ReceivablesPage';
import { NewReceivablePage } from './pages/NewReceivablePage';
import { ReceivableDetailPage } from './pages/ReceivableDetailPage';

type RouterContext = {
  queryClient: QueryClient;
};

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/players' });
  },
});

type LoginSearch = { error?: 'denied' | 'oauth_failed' };

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    error:
      search.error === 'denied' || search.error === 'oauth_failed' ? search.error : undefined,
  }),
  component: LoginPage,
});

// Protected routes share this guard: resolve (or fetch) the `me` query and
// redirect to /login if the session isn't authenticated. Using
// ensureQueryData means the auth check and the auth data fetch are the same
// call — see ADR 0005.
async function requireAuth({ context }: { context: RouterContext }) {
  const me = await context.queryClient.ensureQueryData(meQueryOptions);
  if (!me.authenticated) {
    throw redirect({ to: '/login' });
  }
}

const playersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/players',
  beforeLoad: requireAuth,
  component: PlayersPage,
});

const newPlayerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/players/new',
  beforeLoad: requireAuth,
  component: NewPlayerPage,
});

// Exported (like loginRoute) so PlayerDetailPage can read the $playerId param
// via this route's own `.useParams()` — see docs/decisions/0005.
export const playerDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/players/$playerId',
  beforeLoad: async ({ context }) => {
    await requireAuth({ context });
    await context.queryClient.ensureQueryData(playersQueryOptions);
  },
  component: PlayerDetailPage,
});

const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calendar',
  beforeLoad: async ({ context }) => {
    await requireAuth({ context });
    await context.queryClient.ensureQueryData(eventsQueryOptions);
  },
  component: CalendarPage,
});

const newEventRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calendar/new',
  beforeLoad: requireAuth,
  component: NewEventPage,
});

const seasonsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/seasons',
  beforeLoad: async ({ context }) => {
    await requireAuth({ context });
    await context.queryClient.ensureQueryData(seasonsQueryOptions);
  },
  component: SeasonsPage,
});

const newSeasonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/seasons/new',
  beforeLoad: requireAuth,
  component: NewSeasonPage,
});

// Exported so the page can read $seasonId via this route's own .useParams()
// — same pattern as playerDetailRoute.
export const seasonDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/seasons/$seasonId',
  beforeLoad: async ({ context, params }) => {
    await requireAuth({ context });
    await context.queryClient.ensureQueryData(seasonDetailQueryOptions(Number(params.seasonId)));
  },
  component: SeasonDetailPage,
});

export const newSeasonCalculationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/seasons/$seasonId/calculation',
  beforeLoad: async ({ context }) => {
    await requireAuth({ context });
    // The wizard picks from the roster, so have it ready before it renders.
    await context.queryClient.ensureQueryData(playersQueryOptions);
  },
  component: NewSeasonCalculationPage,
});

const receivablesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/receivables',
  beforeLoad: async ({ context }) => {
    await requireAuth({ context });
    // The page opens on the unpaid view, so that's what gets prefetched; the
    // debtor tab and the "vše" filter load on demand.
    await context.queryClient.ensureQueryData(receivablesQueryOptions('open'));
  },
  component: ReceivablesPage,
});

const newReceivableRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/receivables/new',
  beforeLoad: requireAuth,
  component: NewReceivablePage,
});

// Exported so the page can read $receivableId via this route's own
// .useParams() — same pattern as playerDetailRoute.
export const receivableDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/receivables/$receivableId',
  beforeLoad: async ({ context, params }) => {
    await requireAuth({ context });
    await context.queryClient.ensureQueryData(
      receivableDetailQueryOptions(Number(params.receivableId)),
    );
  },
  component: ReceivableDetailPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  playersRoute,
  newPlayerRoute,
  playerDetailRoute,
  calendarRoute,
  newEventRoute,
  seasonsRoute,
  newSeasonRoute,
  seasonDetailRoute,
  newSeasonCalculationRoute,
  receivablesRoute,
  newReceivableRoute,
  receivableDetailRoute,
]);

export const router = createRouter({
  routeTree,
  context: { queryClient },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
