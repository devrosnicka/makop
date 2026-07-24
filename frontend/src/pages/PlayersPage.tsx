import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { playersQueryOptions } from '@/api/queries';
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
import { PlayerListItem } from '@/components/players/PlayerListItem';

export function PlayersPage() {
  const { data: players = [], isLoading, error } = useQuery(playersQueryOptions);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">Player roster</CardTitle>
        <CardDescription>Tap a player for details.</CardDescription>
        <CardAction>
          <Button asChild size="sm">
            <Link to="/players/new">Add player</Link>
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
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : players.length === 0 ? (
          <p className="text-sm text-muted-foreground">No players yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {players.map((player) => (
              <PlayerListItem key={player.id} player={player} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
