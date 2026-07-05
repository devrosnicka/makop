import { useEffect, useState } from 'react';

type Health = { db: 'ok' | 'error'; serverTime: string };

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch((err) => setError(String(err)));
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>makop</h1>
      <p>Team management for a Sunday-league small-sided football team.</p>
      <h2>Backend status</h2>
      {error && <p>Error: {error}</p>}
      {!error && !health && <p>Loading...</p>}
      {health && (
        <ul>
          <li>DB: {health.db}</li>
          <li>Server time: {health.serverTime}</li>
        </ul>
      )}
    </main>
  );
}
