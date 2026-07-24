import type { PlayerPosition } from '@/api/queries';
import { Badge } from '@/components/ui/badge';
import { positionLabel } from './positions';

export function PositionBadges({ positions }: { positions: PlayerPosition[] }) {
  if (positions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {positions.map((position) => (
        <Badge key={position} variant="secondary">
          {positionLabel(position)}
        </Badge>
      ))}
    </div>
  );
}
