import { Outlet, Link } from '@tanstack/react-router';
import { useAuth } from '@/auth/useAuth';
import { useLogout } from '@/api/mutations';
import { Button } from '@/components/ui/button';
import { AppNav } from './AppNav';
import { HealthFooter } from '@/pages/HealthFooter';

export function RootLayout() {
  const { loading, authenticated, email } = useAuth();
  const logout = useLogout();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <Link to="/players">
              <h1 className="font-display text-3xl font-black tracking-tight">makop</h1>
            </Link>
            <p className="text-sm text-muted-foreground">
              Team management for a Sunday-league small-sided football team.
            </p>
          </div>
          {!loading && authenticated && (
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{email}</span>
              </p>
              <Button variant="outline" size="sm" onClick={() => logout.mutate()}>
                Log out
              </Button>
            </div>
          )}
        </div>
        {!loading && authenticated && <AppNav />}
      </header>

      <Outlet />

      <HealthFooter />
    </main>
  );
}
