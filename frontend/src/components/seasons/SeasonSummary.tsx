import { formatCzk } from './calculation';

type SeasonSummaryProps = {
  selectedPlayersCount: number;
  registrationCost: number;
  refereeCost: number;
  totalSeasonCost: number;
  playerContribution: number;
};

/**
 * The cost breakdown, shared by the wizard's confirmation step (live preview)
 * and the season detail (the stored, locked snapshot) so both always read the
 * same way.
 */
export function SeasonSummary({
  selectedPlayersCount,
  registrationCost,
  refereeCost,
  totalSeasonCost,
  playerContribution,
}: SeasonSummaryProps) {
  const surplus = playerContribution * selectedPlayersCount - totalSeasonCost;

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Počet hráčů</dt>
        <dd className="text-right font-medium tabular-nums">{selectedPlayersCount}</dd>
        <dt className="text-muted-foreground">Náklady za registraci</dt>
        <dd className="text-right font-medium tabular-nums">{formatCzk(registrationCost)}</dd>
        <dt className="text-muted-foreground">Náklady za pískání</dt>
        <dd className="text-right font-medium tabular-nums">{formatCzk(refereeCost)}</dd>
        <dt className="font-medium">Celkové náklady sezóny</dt>
        <dd className="text-right font-medium tabular-nums">{formatCzk(totalSeasonCost)}</dd>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-primary px-4 py-3 text-primary-foreground">
        <span className="text-xs font-bold tracking-widest uppercase">Příspěvek na hráče</span>
        <span className="font-display text-2xl font-black tabular-nums">
          {formatCzk(playerContribution)}
        </span>
      </div>

      {surplus > 0 && (
        <p className="text-xs text-muted-foreground">
          Zaokrouhleno nahoru — na účtu týmu zůstane přebytek {formatCzk(surplus)}.
        </p>
      )}
    </div>
  );
}
