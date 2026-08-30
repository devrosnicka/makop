// Czech noun counting has three forms — 1 hráč / 2–4 hráči / 5+ hráčů — so a
// plain `${n} hráčů` reads wrong for small squads. Only players need this so
// far; generalise if a second noun shows up.
export function playersLabel(count: number): string {
  if (count === 1) return '1 hráč';
  if (count >= 2 && count <= 4) return `${count} hráči`;
  return `${count} hráčů`;
}
