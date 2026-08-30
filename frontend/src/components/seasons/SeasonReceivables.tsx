import { useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { useGenerateSeasonReceivables } from '@/api/mutations';
import { formatCzk } from '@/lib/money';
import { receivablesLabel } from '@/lib/plural';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SeasonReceivablesProps = {
  seasonId: number;
  playerContribution: number;
  receivablesCount: number;
};

/**
 * AC2 — turning a season's locked calculation into actual receivables. Kept a
 * separate, manager-triggered step (rather than a side effect of confirming
 * the calculation) so the due date can be chosen here, and so a season can be
 * calculated without immediately billing anyone.
 */
export function SeasonReceivables({
  seasonId,
  playerContribution,
  receivablesCount,
}: SeasonReceivablesProps) {
  const generate = useGenerateSeasonReceivables(seasonId);
  const [dueDate, setDueDate] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await generate.mutateAsync(dueDate);
  }

  if (receivablesCount > 0) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Pohledávky</h3>
        <p className="text-sm text-muted-foreground">
          Z tohoto výpočtu {receivablesCount === 1 ? 'vznikla' : 'vznikly'}{' '}
          {receivablesLabel(receivablesCount)} po {formatCzk(playerContribution)}.
        </p>
        <Button asChild variant="outline" size="sm" className="self-start">
          <Link to="/receivables">Zobrazit pohledávky</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">Pohledávky</h3>
      <p className="text-sm text-muted-foreground">
        Vytvoří jednu pohledávku na {formatCzk(playerContribution)} pro každého hráče z výpočtu.
      </p>

      {generate.error && (
        <Alert variant="destructive">
          <AlertDescription>{generate.error.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex w-full flex-col gap-1.5">
        <Label htmlFor="receivables_due_date">Splatnost (nepovinné)</Label>
        <Input
          id="receivables_due_date"
          type="date"
          className="w-full"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={generate.isPending} className="self-start">
        Vygenerovat pohledávky
      </Button>
    </form>
  );
}
