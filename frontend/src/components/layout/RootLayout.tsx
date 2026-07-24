import { Outlet, Link } from '@tanstack/react-router';
import { useAuth } from '@/auth/useAuth';
import { useLogout } from '@/api/mutations';
import { Button } from '@/components/ui/button';
import { AppNav } from './AppNav';
import { HealthFooter } from '@/pages/HealthFooter';

export function RootLayout() {
  const { loading, authenticated, email } = useAuth();
  const logout = useLogout();
  const shortEmail = email ? `${email.slice(0, 5)}…` : '';

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-col">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 pt-6 pb-4 sm:px-6 sm:pt-10 sm:pb-6">
          <Link to="/players">
            <h1 className="font-display text-3xl font-black tracking-tight">makop</h1>
          </Link>
          {!loading && authenticated && (
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Signed in as{' '}
                <span className="font-medium text-foreground">
                  <span className="sm:hidden">{shortEmail}</span>
                  <span className="hidden sm:inline">{email}</span>
                </span>
              </p>
              <Button variant="outline" size="sm" onClick={() => logout.mutate()}>
                Log out
              </Button>
            </div>
          )}
        </div>
        {!loading && authenticated && (
          <div className="w-full border-y border-border bg-card">
            <div className="mx-auto max-w-3xl px-4 py-1 sm:px-6">
              <AppNav />
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10">
        <Outlet />

        <HealthFooter />
      </main>
    </div>
  );
}
