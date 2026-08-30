import type { ReceivableStatus, ReceivableSourceType, Receivable } from '@/api/queries';

// Czech copy + the Badge look for each status, kept in one place so the list,
// the detail and the debtor view can never disagree about what a status means.
export const STATUS_LABELS: Record<ReceivableStatus, string> = {
  pending: 'Neuhrazeno',
  partially_paid: 'Částečně uhrazeno',
  paid: 'Uhrazeno',
  cancelled: 'Zrušeno',
};

export const STATUS_BADGE_VARIANTS: Record<
  ReceivableStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  pending: 'destructive',
  partially_paid: 'secondary',
  paid: 'default',
  cancelled: 'outline',
};

export const SOURCE_LABELS: Record<ReceivableSourceType, string> = {
  season: 'Sezónní příspěvek',
  jersey: 'Dres',
  friendly_match: 'Přátelský zápas',
  manual: 'Ruční pohledávka',
};

// What is still owed. Overpayments are allowed (cash, rounding), so this
// clamps at zero and `surplusOf` reports the excess separately.
export function remainingOf(receivable: Pick<Receivable, 'amount' | 'paid_total'>): number {
  return Math.max(receivable.amount - receivable.paid_total, 0);
}

export function surplusOf(receivable: Pick<Receivable, 'amount' | 'paid_total'>): number {
  return Math.max(receivable.paid_total - receivable.amount, 0);
}

const DATE = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });

// Dates arrive as plain 'YYYY-MM-DD' strings (backend/src/db.ts keeps DATE
// columns as strings), so they're split by hand rather than through Date
// parsing, which would drift a day in some timezones.
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return DATE.format(new Date(year, month - 1, day));
}

// The value a <input type="date"> wants for "today", in local time.
export function todayInputValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
