import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from './auth/AuthContext';
import { apiFetch } from './api/client';

type Health = { db: 'ok' | 'error'; serverTime: string };

type Player = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  jersey_number: number | null;
  position: string | null;
  notes: string | null;
  created_at: string;
};

type NewPlayer = {
  name: string;
  email: string;
  phone: string;
  jersey_number: string;
  position: string;
  notes: string;
};

const emptyNewPlayer: NewPlayer = {
  name: '',
  email: '',
  phone: '',
  jersey_number: '',
  position: '',
  notes: '',
};

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

function RosterPanel() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<NewPlayer>(emptyNewPlayer);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<{ players: Player[] }>('/api/players')
      .then((data) => setPlayers(data.players))
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (form.name.trim().length === 0) {
      setError('Name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await apiFetch<Player>('/api/players', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          jersey_number: form.jersey_number,
          position: form.position,
          notes: form.notes,
        }),
      });
      setPlayers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setForm(emptyNewPlayer);
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setError(null);
    try {
      await apiFetch(`/api/players/${id}`, { method: 'DELETE' });
      setPlayers((prev) => prev.filter((player) => player.id !== id));
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <>
      <h2>Player roster</h2>
      {error && <p role="alert">Error: {error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && (
        <ul>
          {players.map((player) => (
            <li key={player.id}>
              {player.name}
              {player.jersey_number != null && ` (#${player.jersey_number})`}
              {player.position && ` — ${player.position}`}
              {player.email && ` — ${player.email}`}
              {player.phone && ` — ${player.phone}`}
              {player.notes && ` — ${player.notes}`}{' '}
              <button type="button" onClick={() => void handleDelete(player.id)}>
                Delete
              </button>
            </li>
          ))}
          {players.length === 0 && <li>No players yet.</li>}
        </ul>
      )}
      <form onSubmit={(event) => void handleAdd(event)}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          placeholder="Jersey #"
          value={form.jersey_number}
          onChange={(e) => setForm({ ...form, jersey_number: e.target.value })}
        />
        <input
          placeholder="Position"
          value={form.position}
          onChange={(e) => setForm({ ...form, position: e.target.value })}
        />
        <input
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <button type="submit" disabled={submitting}>
          Add player
        </button>
      </form>
    </>
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
      {!loading && authenticated && <RosterPanel />}
      <HealthPanel />
    </main>
  );
}
