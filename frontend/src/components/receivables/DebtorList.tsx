import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { debtorsQueryOptions } from '@/api/queries';
import { formatCzk } from '@/lib/money';
import { receivablesLabel } from '@/lib/plural';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDate } from './status';

/**
 * AC5 — who still owes something, across every source, most owed first. The
 * totals come from the backend aggregate (`GET /api/debtors`) rather than being
 * summed in the browser, so the list stays right no matter how it's filtered.
 */
export function DebtorList() {
  const { data: debtors = [], isLoading, error } = useQuery(debtorsQueryOptions);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Načítání…</p>;
  }

  if (debtors.length === 0) {
    return <p className="text-sm text-muted-foreground">Nikdo nic nedluží. 🎉</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {debtors.map((debtor) => (
        <Link
          key={debtor.player_id}
          to="/players/$playerId"
          params={{ playerId: String(debtor.player_id) }}
          className="flex items-center gap-3 rounded-md border bg-card px-4 py-3 transition-colors hover:bg-accent"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate font-medium">
              {debtor.first_name} {debtor.last_name}
            </span>
            <span className="text-xs text-muted-foreground">
              {receivablesLabel(debtor.receivable_count)}
              {debtor.oldest_due_date !== null &&
                ` · nejstarší splatnost ${formatDate(debtor.oldest_due_date)}`}
            </span>
          </div>
          <span className="shrink-0 font-medium tabular-nums text-destructive">
            {formatCzk(debtor.outstanding)}
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}
