import { queryOptions } from '@tanstack/react-query';
import { apiFetch } from './client';

export type Me = { authenticated: boolean; email?: string };
export type Health = { db: 'ok' | 'error'; serverTime: string };
export type PlayerPosition = 'defender' | 'goalkeeper' | 'attacker';

export type Player = {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  jersey_number: number | null;
  positions: PlayerPosition[];
  notes: string | null;
  created_at: string;
};

export type EventType = 'friendly_match' | 'league_match' | 'custom';

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

// GET /api/me is a public route (see docs/specs/manager-auth.md) — used both
// to render sign-in state and, via ensureQueryData in route beforeLoad
// hooks (src/router.tsx), to gate protected routes.
export const meQueryOptions = queryOptions({
  queryKey: ['me'],
  queryFn: () => apiFetch<Me>('/api/me'),
});

export const healthQueryOptions = queryOptions({
  queryKey: ['health'],
  queryFn: () => apiFetch<Health>('/api/health'),
});

export const playersQueryOptions = queryOptions({
  queryKey: ['players'],
  queryFn: () => apiFetch<{ players: Player[] }>('/api/players').then((data) => data.players),
});

export const eventsQueryOptions = queryOptions({
  queryKey: ['events'],
  queryFn: () => apiFetch<{ events: MakopEvent[] }>('/api/events').then((data) => data.events),
});

export type Season = {
  id: number;
  name: string;
  created_by: string | null;
  created_at: string;
  // Present on the list endpoint only (LEFT JOIN); null when the season has
  // no confirmed calculation yet.
  player_contribution: number | null;
  selected_players_count: number | null;
};

export type SeasonCalculation = {
  id: number;
  season_id: number;
  player_registration_fee: number;
  referee_match_fee: number;
  referee_match_count: number;
  selected_players_count: number;
  registration_cost: number;
  referee_cost: number;
  total_season_cost: number;
  player_contribution: number;
  is_locked: boolean;
  created_at: string;
};

export type SeasonCalculationPlayer = {
  id: number;
  season_calculation_id: number;
  player_id: number | null;
  player_name_snapshot: string;
};

export type SeasonDetail = {
  season: Season;
  calculation: SeasonCalculation | null;
  players: SeasonCalculationPlayer[];
  // How many receivables this season has already generated — 0 means the
  // "generate" action is still available (see docs/specs/receivables.md).
  receivables_count: number;
};

export const seasonsQueryOptions = queryOptions({
  queryKey: ['seasons'],
  queryFn: () => apiFetch<{ seasons: Season[] }>('/api/seasons').then((data) => data.seasons),
});

// A factory rather than a constant because the key carries the season id —
// the detail response (season + its locked calculation + player snapshot) is
// what every season screen reads.
export const seasonDetailQueryOptions = (seasonId: number) =>
  queryOptions({
    queryKey: ['seasons', seasonId],
    queryFn: () => apiFetch<SeasonDetail>(`/api/seasons/${seasonId}`),
  });

export type ReceivableStatus = 'pending' | 'partially_paid' | 'paid' | 'cancelled';
export type ReceivableSourceType = 'season' | 'jersey' | 'friendly_match' | 'manual';

// `status` is maintained by the backend from the sum of the payments — the UI
// only ever reads it (see docs/specs/receivables.md).
export type Receivable = {
  id: number;
  player_id: number;
  title: string;
  description: string | null;
  amount: number;
  due_date: string | null;
  status: ReceivableStatus;
  source_type: ReceivableSourceType;
  source_id: number | null;
  created_at: string;
  // Joined by every read endpoint: who owes it, and how much is covered so far.
  player_name: string;
  paid_total: number;
};

export type Payment = {
  id: number;
  receivable_id: number;
  amount: number;
  paid_at: string;
  note: string | null;
  created_at: string;
};

export type ReceivableDetail = {
  receivable: Receivable;
  payments: Payment[];
};

export type Debtor = {
  player_id: number;
  first_name: string;
  last_name: string;
  receivable_count: number;
  outstanding: number;
  oldest_due_date: string | null;
};

// 'open' = still owed (pending + partially_paid), the default view;
// 'all' = no filter. Anything else is a literal status.
export type ReceivableFilter = 'open' | 'all' | ReceivableStatus;

export const receivablesQueryOptions = (filter: ReceivableFilter = 'open') =>
  queryOptions({
    queryKey: ['receivables', 'list', filter],
    queryFn: () =>
      apiFetch<{ receivables: Receivable[] }>(`/api/receivables?status=${filter}`).then(
        (data) => data.receivables,
      ),
  });

export const receivableDetailQueryOptions = (receivableId: number) =>
  queryOptions({
    queryKey: ['receivables', 'detail', receivableId],
    queryFn: () => apiFetch<ReceivableDetail>(`/api/receivables/${receivableId}`),
  });

export const debtorsQueryOptions = queryOptions({
  queryKey: ['debtors'],
  queryFn: () => apiFetch<{ debtors: Debtor[] }>('/api/debtors').then((data) => data.debtors),
});
