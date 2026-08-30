import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import type { Receivable } from '@/api/queries';
import { formatCzk } from '@/lib/money';
import { Badge } from '@/components/ui/badge';
import { formatDate, remainingOf, STATUS_BADGE_VARIANTS, STATUS_LABELS } from './status';

/**
 * One row of the receivables list. Same shape as PlayerListItem: a whole-row
 * link with the identifying text truncating rather than pushing the layout
 * wide, so it survives a 375px viewport.
 */
export function ReceivableRow({ receivable }: { receivable: Receivable }) {
  const remaining = remainingOf(receivable);

  return (
    <Link
      to="/receivables/$receivableId"
      params={{ receivableId: String(receivable.id) }}
      className="flex items-center gap-3 rounded-md border bg-card px-4 py-3 transition-colors hover:bg-accent"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="truncate font-medium">{receivable.player_name}</span>
        {/* The title is the second line: season receivables all share one, so
            leading with the player is what actually distinguishes the rows. */}
        <span className="truncate text-xs text-muted-foreground">{receivable.title}</span>
        <Badge variant={STATUS_BADGE_VARIANTS[receivable.status]}>
          {STATUS_LABELS[receivable.status]}
        </Badge>
      </div>
      {/* Amount, what's left of it and the due date all sit in the right
          column: at 375px the badge and a date won't share a line. */}
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="font-medium tabular-nums">{formatCzk(receivable.amount)}</span>
        {receivable.paid_total > 0 && receivable.status !== 'cancelled' && (
          <span className="text-xs text-muted-foreground tabular-nums">
            zbývá {formatCzk(remaining)}
          </span>
        )}
        {receivable.due_date !== null && (
          <span className="text-xs text-muted-foreground tabular-nums">
            do {formatDate(receivable.due_date)}
          </span>
        )}
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
