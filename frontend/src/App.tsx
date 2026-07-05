import { useEffect, useState } from 'react';
import { useAuth } from './auth/AuthContext';

type Health = { db: 'ok' | 'error'; serverTime: string };

// Google login redirects back here with ?error=denied (not on the
// allowlist) or ?error=oauth_failed (flow itself broke). See
// backend/src/routes/auth.ts and docs/specs/manager-auth.md.
function loginErrorMessage(): string | null {
  const error = new URLSearchParams(window.location.search).get('error');
  if (error === 'denied') return 'That Google account is not authorized for makop.';
  if (error === 'oauth_failed') return 'Google sign-in failed. Please try again.';
  return null;
}

function LoginPanel() {
  const loginError = loginErrorMessage();
  return (
    <div>
      {loginError && <p role="alert">{loginError}</p>}
      <a href="/api/auth/google">
        <button type="button">Sign in with Google</button>
      </a>
    </div>
  );
}

function SignedInPanel() {
  const { email, logout } = useAuth();
  return (
    <div>
      <p>Signed in as {email}</p>
      <button type="button" onClick={() => void logout()}>
        Log out
      </button>
    </div>
  );
}

function HealthPanel() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch((err) => setError(String(err)));
  }, []);

  return (
    <>
      <h2>Backend status</h2>
      {error && <p>Error: {error}</p>}
      {!error && !health && <p>Loading...</p>}
      {health && (
        <ul>
          <li>DB: {health.db}</li>
          <li>Server time: {health.serverTime}</li>
        </ul>
      )}
    </>
  );
}

export default function App() {
  const { loading, authenticated } = useAuth();

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>makop</h1>
      <p>Team management for a Sunday-league small-sided football team.</p>
      <h2>Manager sign-in</h2>
      {loading && <p>Loading...</p>}
      {!loading && (authenticated ? <SignedInPanel /> : <LoginPanel />)}
      <HealthPanel />
    </main>
  );
}
