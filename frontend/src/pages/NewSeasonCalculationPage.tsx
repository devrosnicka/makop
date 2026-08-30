import { Link } from '@tanstack/react-router';
import { newSeasonCalculationRoute } from '@/router';
import { SeasonCalculationForm } from '@/components/seasons/SeasonCalculationForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function NewSeasonCalculationPage() {
  const { seasonId } = newSeasonCalculationRoute.useParams();

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Výpočet příspěvku</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <SeasonCalculationForm seasonId={Number(seasonId)} />
        <Button asChild variant="ghost" size="sm" className="self-center">
          <Link to="/seasons/$seasonId" params={{ seasonId }}>
            Zrušit
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
