import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Health = { db: 'ok' | 'error'; serverTime: string };

export function HealthPanel() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch((err) => setError(String(err)));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg">Backend status</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm">
        {error && <p className="text-destructive">Error: {error}</p>}
        {!error && !health && <p className="text-muted-foreground">Loading...</p>}
        {health && (
          <>
            <p>
              <span className="text-muted-foreground">DB:</span> {health.db}
            </p>
            <p>
              <span className="text-muted-foreground">Server time:</span> {health.serverTime}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
