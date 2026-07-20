import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { meQueryOptions, playersQueryOptions, type Me, type Player } from './queries';

export type NewPlayer = {
  name: string;
  email: string;
  phone: string;
  jersey_number: string;
  position: string;
  notes: string;
};

export function useCreatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (player: NewPlayer) =>
      apiFetch<Player>('/api/players', { method: 'POST', body: JSON.stringify(player) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: playersQueryOptions.queryKey }),
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
  return useMutation({
    mutationFn: () => apiFetch('/api/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.setQueryData<Me>(meQueryOptions.queryKey, { authenticated: false });
    },
  });
}
