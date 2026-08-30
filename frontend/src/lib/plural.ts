// Czech noun counting has three forms — 1 hráč / 2–4 hráči / 5+ hráčů — so a
// plain `${n} hráčů` reads wrong for small squads. This started life next to
// the season wizard for players only; receivables were the second noun, so it
// moved here and got a shared core.
function czechPlural(count: number, one: string, few: string, many: string): string {
  if (count === 1) return `1 ${one}`;
  if (count >= 2 && count <= 4) return `${count} ${few}`;
  return `${count} ${many}`;
}

export function playersLabel(count: number): string {
  return czechPlural(count, 'hráč', 'hráči', 'hráčů');
}

export function receivablesLabel(count: number): string {
  return czechPlural(count, 'pohledávka', 'pohledávky', 'pohledávek');
}
