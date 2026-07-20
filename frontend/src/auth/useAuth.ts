import { useQuery } from '@tanstack/react-query';
import { meQueryOptions } from '../api/queries';

/**
 * Thin wrapper over the `me` query (see docs/specs/manager-auth.md for the
 * full login/logout flow). Replaces the old AuthContext/AuthProvider —
 * auth state is just server state now, cached by TanStack Query and shared
 * across the tree without a separate context. Protected routes gate on the
 * same query via beforeLoad in src/router.tsx.
 */
export function useAuth() {
  const { data, isLoading } = useQuery(meQueryOptions);
  return {
    loading: isLoading,
    authenticated: data?.authenticated ?? false,
    email: data?.email ?? null,
  };
}
