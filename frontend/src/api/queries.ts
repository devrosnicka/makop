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
