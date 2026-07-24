import type { EventType } from '@/api/queries';

// Canonical list of selectable event types — shared by the create-event form
// (toggle chips) and the calendar strip's event labels/markers.
export const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'friendly_match', label: 'Friendly match' },
  { value: 'league_match', label: 'League match' },
  { value: 'custom', label: 'Custom event' },
];

export function eventTypeLabel(value: EventType): string {
  return EVENT_TYPES.find((t) => t.value === value)?.label ?? value;
}
