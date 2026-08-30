import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { playersQueryOptions } from '@/api/queries';
import { useCreateSeasonCalculation } from '@/api/mutations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calculateSeason, parseAmount } from './calculation';
import { playersLabel } from './plural';
import { SeasonSummary } from './SeasonSummary';

// One step per tier of input, ending in an explicit confirmation — unlike
// NewPlayerForm, there's no "save from any step": the numbers are only
// meaningful once every input is in, and confirming locks them forever
// (docs/specs/season-fee-calculation.md).
const STEPS = [{ title: 'Hráči' }, { title: 'Vstupní parametry' }, { title: 'Souhrn' }] as const;

export function SeasonCalculationForm({ seasonId }: { seasonId: number }) {
  const navigate = useNavigate();
  const { data: players = [], isLoading } = useQuery(playersQueryOptions);
  const createCalculation = useCreateSeasonCalculation(seasonId);

  const [step, setStep] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [registrationFee, setRegistrationFee] = useState('');
  const [refereeFee, setRefereeFee] = useState('');
  const [refereeCount, setRefereeCount] = useState('');

  const selectedCount = selectedIds.length;
  const allSelected = players.length > 0 && selectedCount === players.length;
  const isLastStep = step === STEPS.length - 1;

  const result = calculateSeason({
    selectedPlayersCount: selectedCount,
    playerRegistrationFee: parseAmount(registrationFee),
    refereeMatchFee: parseAmount(refereeFee),
    refereeMatchCount: parseAmount(refereeCount),
  });

  function togglePlayer(id: number, checked: boolean) {
    setSelectedIds((ids) => (checked ? [...ids, id] : ids.filter((existing) => existing !== id)));
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : players.map((player) => player.id));
  }

  async function handleConfirm(event: FormEvent) {
    event.preventDefault();
    // Only the summary step confirms. The guard matters: React reuses the DOM
    // node between the "Pokračovat" and "Potvrdit a uložit" branches below, so
    // the click that advances into the last step would otherwise also trigger
    // the (now type="submit") button's default action and save immediately.
    if (!isLastStep || selectedCount === 0) return;

    await createCalculation.mutateAsync({
      player_ids: selectedIds,
      player_registration_fee: parseAmount(registrationFee),
      referee_match_fee: parseAmount(refereeFee),
      referee_match_count: parseAmount(refereeCount),
    });
    navigate({ to: '/seasons/$seasonId', params: { seasonId: String(seasonId) } });
  }

  return (
    <form onSubmit={(event) => void handleConfirm(event)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Krok {step + 1} ze {STEPS.length} · {STEPS[step].title}
        </p>
      </div>

      {createCalculation.error && (
        <Alert variant="destructive">
          <AlertDescription>{createCalculation.error.message}</AlertDescription>
        </Alert>
      )}

      {step === 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">Vybráno: {playersLabel(selectedCount)}</p>
            {players.length > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
                {allSelected ? 'Zrušit výběr' : 'Vybrat všechny'}
              </Button>
            )}
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Načítání…</p>
          ) : players.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Zatím nejsou žádní hráči — nejdřív je přidej do soupisky.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {players.map((player) => (
                <Label
                  key={player.id}
                  className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm font-normal"
                >
                  <Checkbox
                    checked={selectedIds.includes(player.id)}
                    onCheckedChange={(checked) => togglePlayer(player.id, checked === true)}
                  />
                  <span className="min-w-0 break-words">
                    {player.first_name} {player.last_name}
                  </span>
                  {player.jersey_number !== null && (
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
                      #{player.jersey_number}
                    </span>
                  )}
                </Label>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="flex w-full flex-col gap-1.5">
            <Label htmlFor="registration_fee">Poplatek za jednoho hráče (Kč)</Label>
            <Input
              id="registration_fee"
              type="number"
              inputMode="numeric"
              min="0"
              autoFocus
              className="w-full"
              value={registrationFee}
              onChange={(e) => setRegistrationFee(e.target.value)}
            />
          </div>
          <div className="flex w-full flex-col gap-1.5">
            <Label htmlFor="referee_fee">Cena za odpískání jednoho zápasu (Kč)</Label>
            <Input
              id="referee_fee"
              type="number"
              inputMode="numeric"
              min="0"
              className="w-full"
              value={refereeFee}
              onChange={(e) => setRefereeFee(e.target.value)}
            />
          </div>
          <div className="flex w-full flex-col gap-1.5">
            <Label htmlFor="referee_count">Počet zápasů k odpískání</Label>
            <Input
              id="referee_count"
              type="number"
              inputMode="numeric"
              min="0"
              className="w-full"
              value={refereeCount}
              onChange={(e) => setRefereeCount(e.target.value)}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <SeasonSummary
            selectedPlayersCount={selectedCount}
            registrationCost={result.registrationCost}
            refereeCost={result.refereeCost}
            totalSeasonCost={result.totalSeasonCost}
            playerContribution={result.playerContribution}
          />
          <Alert>
            <AlertDescription>
              Po potvrzení už nelze měnit vstupní parametry ani seznam hráčů. Oprava znamená výpočet
              smazat a vytvořit nový.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex gap-2">
        {step > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            className="flex-1"
          >
            Zpět
          </Button>
        )}
        {!isLastStep ? (
          <Button
            key="continue"
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={selectedCount === 0}
            className="flex-1"
          >
            Pokračovat
          </Button>
        ) : (
          <Button
            key="confirm"
            type="submit"
            disabled={createCalculation.isPending || selectedCount === 0}
            className="flex-1"
          >
            Potvrdit a uložit
          </Button>
        )}
      </div>
    </form>
  );
}
