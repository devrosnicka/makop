import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import type { Player } from '@/api/queries';
import { PositionBadges } from './PositionBadges';

export function PlayerListItem({ player }: { player: Player }) {
  return (
    <Link
      to="/players/$playerId"
      params={{ playerId: String(player.id) }}
      className="flex items-center gap-3 rounded-md border bg-card px-4 py-3 transition-colors hover:bg-accent"
    >
      <span
        className={
          player.jersey_number !== null
            ? 'w-8 shrink-0 text-center text-sm font-bold tabular-nums text-primary'
            : 'w-8 shrink-0 text-center text-sm tabular-nums text-muted-foreground'
        }
      >
        {player.jersey_number !== null ? `#${player.jersey_number}` : '—'}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="truncate font-medium">
          {player.first_name} {player.last_name}
        </span>
        <PositionBadges positions={player.positions} />
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
