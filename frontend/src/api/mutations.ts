import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { apiFetch } from './client';
import {
  meQueryOptions,
  playersQueryOptions,
  eventsQueryOptions,
  type Me,
  type Player,
  type PlayerPosition,
  type MakopEvent,
  type EventType,
} from './queries';

export type NewPlayer = {
  first_name: string;
  last_name: string;
  phone: string;
  positions: PlayerPosition[];
  jersey_number: string;
  email: string;
  notes: string;
};

export type NewEvent = {
  event_type: EventType | '';
  title: string;
  event_date: string;
  start_time: string;
  address: string;
  description: string;
};

export function useCreatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (player: NewPlayer) =>
      apiFetch<Player>('/api/players', { method: 'POST', body: JSON.stringify(player) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: playersQueryOptions.queryKey }),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (event: NewEvent) =>
      apiFetch<MakopEvent>('/api/events', { method: 'POST', body: JSON.stringify(event) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventsQueryOptions.queryKey }),
  });
}

export function useDeletePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/players/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: playersQueryOptions.queryKey }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => apiFetch('/api/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.setQueryData<Me>(meQueryOptions.queryKey, { authenticated: false });
      navigate({ to: '/login' });
    },
  });
}
