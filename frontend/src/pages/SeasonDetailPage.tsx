import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { seasonDetailRoute } from '@/router';
import { seasonDetailQueryOptions } from '@/api/queries';
import { useDeleteSeasonCalculation } from '@/api/mutations';
import { formatCzk } from '@/components/seasons/calculation';
import { SeasonSummary } from '@/components/seasons/SeasonSummary';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function SeasonDetailPage() {
  const { seasonId } = seasonDetailRoute.useParams();
  const id = Number(seasonId);
  const { data, error } = useQuery(seasonDetailQueryOptions(id));
  const deleteCalculation = useDeleteSeasonCalculation(id);

  if (!data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 pt-6">
          <p className="text-sm text-muted-foreground">
            {error ? error.message : 'Sezóna nenalezena.'}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/seasons">Zpět na sezóny</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { season, calculation, players } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">{season.name}</CardTitle>
        <CardDescription>
          {calculation ? 'Výpočet je uzamčený a už se nemění.' : 'Sezóna zatím nemá výpočet.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {deleteCalculation.error && (
          <Alert variant="destructive">
            <AlertDescription>{deleteCalculation.error.message}</AlertDescription>
          </Alert>
        )}

        {!calculation ? (
          <Button asChild>
            <Link to="/seasons/$seasonId/calculation" params={{ seasonId: String(id) }}>
              Spočítat příspěvek
            </Link>
          </Button>
        ) : (
          <>
            <SeasonSummary
              selectedPlayersCount={calculation.selected_players_count}
              registrationCost={calculation.registration_cost}
              refereeCost={calculation.referee_cost}
              totalSeasonCost={calculation.total_season_cost}
              playerContribution={calculation.player_contribution}
            />

            <Separator />

            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Vstupní parametry</h3>
              <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Poplatek za hráče</dt>
                <dd className="text-right tabular-nums">
                  {formatCzk(calculation.player_registration_fee)}
                </dd>
                <dt className="text-muted-foreground">Cena za odpískání zápasu</dt>
                <dd className="text-right tabular-nums">
                  {formatCzk(calculation.referee_match_fee)}
                </dd>
                <dt className="text-muted-foreground">Počet zápasů k odpískání</dt>
                <dd className="text-right tabular-nums">{calculation.referee_match_count}</dd>
              </dl>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Hráči ve výpočtu ({players.length})</h3>
              <ul className="flex flex-col gap-1 text-sm">
                {players.map((player) => (
                  <li key={player.id} className="rounded-md border bg-card px-3 py-2 break-words">
                    {player.player_name_snapshot}
                  </li>
                ))}
              </ul>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Smazat výpočet</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Smazat výpočet sezóny {season.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Uzamčený výpočet nejde upravit — smazáním zmizí i snapshot hráčů a bude potřeba
                    spočítat příspěvek znovu.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Zrušit</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void deleteCalculation.mutateAsync()}>
                    Smazat
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        <Button asChild variant="ghost" size="sm" className="self-center">
          <Link to="/seasons">Zpět na sezóny</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
