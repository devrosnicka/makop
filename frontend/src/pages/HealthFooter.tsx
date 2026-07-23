import { useQuery } from '@tanstack/react-query';
import { healthQueryOptions } from '@/api/queries';

export function HealthFooter() {
  const { data: health, error, isLoading } = useQuery(healthQueryOptions);

  return (
    <footer className="mt-auto border-t border-border pt-3 text-xs text-muted-foreground">
      {error && <p className="text-destructive">Backend unreachable: {error.message}</p>}
      {!error && isLoading && <p>Checking backend…</p>}
      {!error && health && (
        <p>
          Backend · DB{' '}
          <span className={health.db === 'ok' ? 'text-foreground' : 'text-destructive'}>
            {health.db}
          </span>{' '}
          · {new Date(health.serverTime).toLocaleTimeString()}
        </p>
      )}
    </footer>
  );
}
