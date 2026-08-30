import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { apiFetch } from './client';
import {
  meQueryOptions,
  playersQueryOptions,
  eventsQueryOptions,
  seasonsQueryOptions,
  seasonDetailQueryOptions,
  type Me,
  type Player,
  type PlayerPosition,
  type MakopEvent,
  type EventType,
  type Season,
  type SeasonCalculation,
  type SeasonCalculationPlayer,
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

export type NewSeasonCalculation = {
  player_ids: number[];
  player_registration_fee: number;
  referee_match_fee: number;
  referee_match_count: number;
};

export function useCreateSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch<Season>('/api/seasons', { method: 'POST', body: JSON.stringify({ name }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: seasonsQueryOptions.queryKey }),
  });
}

export function useCreateSeasonCalculation(seasonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (calculation: NewSeasonCalculation) =>
      apiFetch<{ calculation: SeasonCalculation; players: SeasonCalculationPlayer[] }>(
        `/api/seasons/${seasonId}/calculation`,
        { method: 'POST', body: JSON.stringify(calculation) },
      ),
    // Both the list (which shows the contribution) and this season's detail
    // change when a calculation is created.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: seasonsQueryOptions.queryKey });
      void queryClient.invalidateQueries({ queryKey: seasonDetailQueryOptions(seasonId).queryKey });
    },
  });
}

export function useDeleteSeasonCalculation(seasonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>(`/api/seasons/${seasonId}/calculation`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: seasonsQueryOptions.queryKey });
      void queryClient.invalidateQueries({ queryKey: seasonDetailQueryOptions(seasonId).queryKey });
    },
  });
}
