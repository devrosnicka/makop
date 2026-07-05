import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiFetch } from '../api/client';

type Me = { authenticated: boolean; email?: string };

type AuthContextValue = {
  loading: boolean;
  authenticated: boolean;
  email: string | null;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Checks session state via GET /api/me on mount (public route — doesn't
 * require auth itself) and exposes it to the tree. See
 * docs/specs/manager-auth.md for the full login/logout flow.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me>({ authenticated: false });

  useEffect(() => {
    apiFetch<Me>('/api/me')
      .then(setMe)
      .catch(() => setMe({ authenticated: false }))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await apiFetch('/api/logout', { method: 'POST' });
    setMe({ authenticated: false });
  }

  return (
    <AuthContext.Provider
      value={{ loading, authenticated: me.authenticated, email: me.email ?? null, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
