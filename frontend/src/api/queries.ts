import { queryOptions } from '@tanstack/react-query';
import { apiFetch } from './client';

export type Me = { authenticated: boolean; email?: string };
export type Health = { db: 'ok' | 'error'; serverTime: string };
export type Player = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  jersey_number: number | null;
  position: string | null;
  notes: string | null;
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
