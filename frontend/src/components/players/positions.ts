import type { PlayerPosition } from '@/api/queries';

// Canonical list of selectable positions — shared by the add-player form
// (toggle chips) and the roster/detail badges so labels stay in one place.
export const POSITIONS: { value: PlayerPosition; label: string }[] = [
  { value: 'goalkeeper', label: 'Goalkeeper' },
  { value: 'defender', label: 'Defender' },
  { value: 'attacker', label: 'Attacker' },
];

export function positionLabel(value: PlayerPosition): string {
  return POSITIONS.find((p) => p.value === value)?.label ?? value;
}
