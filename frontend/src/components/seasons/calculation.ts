// The season fee formula, mirrored from backend/src/routes/seasons.ts so the
// wizard can preview the result live. The backend recomputes everything from
// the raw inputs on confirm — these numbers are never sent as the source of
// truth. See docs/specs/season-fee-calculation.md.
export type SeasonCalculationInput = {
  selectedPlayersCount: number;
  playerRegistrationFee: number;
  refereeMatchFee: number;
  refereeMatchCount: number;
};

export type SeasonCalculationResult = {
  registrationCost: number;
  refereeCost: number;
  totalSeasonCost: number;
  playerContribution: number;
  // What the rounding-up leaves over for the team account.
  surplus: number;
};

export function calculateSeason(input: SeasonCalculationInput): SeasonCalculationResult {
  const registrationCost = input.selectedPlayersCount * input.playerRegistrationFee;
  const refereeCost = input.refereeMatchFee * input.refereeMatchCount;
  const totalSeasonCost = registrationCost + refereeCost;
  // Rounded up so the team account is never short; the surplus stays with the
  // team.
  const playerContribution =
    input.selectedPlayersCount > 0 ? Math.ceil(totalSeasonCost / input.selectedPlayersCount) : 0;

  return {
    registrationCost,
    refereeCost,
    totalSeasonCost,
    playerContribution,
    surplus: playerContribution * input.selectedPlayersCount - totalSeasonCost,
  };
}
