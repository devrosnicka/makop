import { useAuth } from './auth/AuthContext';
import { HealthPanel } from './components/panels/HealthPanel';
import { LoginPanel } from './components/panels/LoginPanel';
import { RosterPanel } from './components/panels/RosterPanel';
import { SignedInPanel } from './components/panels/SignedInPanel';

export default function App() {
  const { loading, authenticated } = useAuth();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-black tracking-tight">makop</h1>
        <p className="text-sm text-muted-foreground">
          Team management for a Sunday-league small-sided football team.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold">Manager sign-in</h2>
        {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!loading && (authenticated ? <SignedInPanel /> : <LoginPanel />)}
      </section>

      {!loading && authenticated && <RosterPanel />}

      <HealthPanel />
    </main>
  );
}
