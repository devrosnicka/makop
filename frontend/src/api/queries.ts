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
