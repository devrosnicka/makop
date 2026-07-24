import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { playerDetailRoute } from '@/router';
import { playersQueryOptions } from '@/api/queries';
import { useDeletePlayer } from '@/api/mutations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PositionBadges } from '@/components/players/PositionBadges';

export function PlayerDetailPage() {
  const { playerId } = playerDetailRoute.useParams();
  const navigate = useNavigate();
  const { data: players = [] } = useQuery(playersQueryOptions);
  const deletePlayer = useDeletePlayer();

  const player = players.find((p) => p.id === Number(playerId));

  if (!player) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 pt-6">
          <p className="text-sm text-muted-foreground">Player not found.</p>
          <Button asChild variant="outline" size="sm">
            <Link to="/players">Back to roster</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleDelete = async () => {
    await deletePlayer.mutateAsync(player.id);
    navigate({ to: '/players' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">
          {player.first_name} {player.last_name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {deletePlayer.error && (
          <Alert variant="destructive">
            <AlertDescription>{deletePlayer.error.message}</AlertDescription>
          </Alert>
        )}

        <PositionBadges positions={player.positions} />

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Jersey #</dt>
          <dd>{player.jersey_number ?? '—'}</dd>
          <dt className="text-muted-foreground">Phone</dt>
          <dd>{player.phone ?? '—'}</dd>
          <dt className="text-muted-foreground">Email</dt>
          <dd>{player.email ?? '—'}</dd>
          <dt className="text-muted-foreground">Notes</dt>
          <dd className="whitespace-pre-wrap">{player.notes ?? '—'}</dd>
        </dl>

        <div className="flex gap-2">
          <Button variant="outline" disabled className="flex-1">
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex-1">
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete {player.first_name} {player.last_name}?
                </AlertDialogTitle>
                <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => void handleDelete()}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
