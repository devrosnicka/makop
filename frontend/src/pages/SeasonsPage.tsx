import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { seasonsQueryOptions } from '@/api/queries';
import { formatCzk } from '@/components/seasons/calculation';
import { playersLabel } from '@/components/seasons/plural';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function SeasonsPage() {
  const { data: seasons = [], isLoading, error } = useQuery(seasonsQueryOptions);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">Sezóny</CardTitle>
        <CardDescription>Příspěvek na hráče za sezónu.</CardDescription>
        <CardAction>
          <Button asChild size="sm">
            <Link to="/seasons/new">Nová sezóna</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Načítání…</p>
        ) : seasons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Zatím žádné sezóny.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {seasons.map((season) => (
              <Link
                key={season.id}
                to="/seasons/$seasonId"
                params={{ seasonId: String(season.id) }}
                className="flex items-center gap-3 rounded-md border bg-card px-4 py-3 transition-colors hover:bg-accent"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate font-medium">{season.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {season.player_contribution === null
                      ? 'Bez výpočtu'
                      : `${formatCzk(season.player_contribution)} · ${playersLabel(season.selected_players_count ?? 0)}`}
                  </span>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
