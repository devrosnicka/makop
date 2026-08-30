// Money formatting/parsing shared by every feature that deals in crowns —
// season fees and receivables so far. Amounts are always whole CZK integers,
// matching how the backend stores them (see db/migrations/0004_seasons.sql
// and 0005_receivables.sql).
const CZK = new Intl.NumberFormat('cs-CZ', {
  style: 'currency',
  currency: 'CZK',
  maximumFractionDigits: 0,
});

export function formatCzk(amount: number): string {
  return CZK.format(amount);
}

// Form fields are strings; blank counts as 0 so a live preview stays usable
// while the manager is still typing.
export function parseAmount(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}
