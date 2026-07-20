import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { healthQueryOptions } from '@/api/queries';

export function HealthFooter() {
  const { data: health, error, isLoading } = useQuery(healthQueryOptions);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg">Backend status</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm">
        {error && <p className="text-destructive">Error: {error.message}</p>}
        {!error && isLoading && <p className="text-muted-foreground">Loading...</p>}
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
