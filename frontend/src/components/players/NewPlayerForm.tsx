import { useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCreatePlayer, type NewPlayer } from '@/api/mutations';
import type { PlayerPosition } from '@/api/queries';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { POSITIONS } from './positions';

const emptyForm: NewPlayer = {
  first_name: '',
  last_name: '',
  phone: '',
  positions: [],
  jersey_number: '',
  email: '',
  notes: '',
};

// One tier per step, from most to least important — see docs/specs/player-roster.md.
// Tier 1 (name) is the only required step; the rest can be skipped by saving early.
const STEPS = [
  { title: 'Name' },
  { title: 'Phone' },
  { title: 'Positions & number' },
  { title: 'Email & notes' },
] as const;

export function NewPlayerForm() {
  const navigate = useNavigate();
  const createPlayer = useCreatePlayer();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<NewPlayer>(emptyForm);
  const [showTier1Error, setShowTier1Error] = useState(false);

  const tier1Valid = form.first_name.trim().length > 0 && form.last_name.trim().length > 0;
  const isLastStep = step === STEPS.length - 1;

  function update<K extends keyof NewPlayer>(key: K, value: NewPlayer[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleContinue() {
    if (!tier1Valid) {
      setShowTier1Error(true);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!tier1Valid) {
      setShowTier1Error(true);
      setStep(0);
      return;
    }
    const player = await createPlayer.mutateAsync(form);
    navigate({ to: '/players/$playerId', params: { playerId: String(player.id) } });
  }

  return (
    <form onSubmit={(event) => void handleSave(event)} className="flex flex-col gap-6">
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
          Step {step + 1} of {STEPS.length} · {STEPS[step].title}
        </p>
      </div>

      {createPlayer.error && (
        <Alert variant="destructive">
          <AlertDescription>{createPlayer.error.message}</AlertDescription>
        </Alert>
      )}

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex w-full flex-col gap-1.5">
            <Label htmlFor="first_name">First name</Label>
            <Input
              id="first_name"
              autoFocus
              className="w-full"
              value={form.first_name}
              onChange={(e) => update('first_name', e.target.value)}
              required
            />
          </div>
          <div className="flex w-full flex-col gap-1.5">
            <Label htmlFor="last_name">Last name</Label>
            <Input
              id="last_name"
              className="w-full"
              value={form.last_name}
              onChange={(e) => update('last_name', e.target.value)}
              required
            />
          </div>
          {showTier1Error && !tier1Valid && (
            <p className="text-sm text-destructive">First and last name are required.</p>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="flex w-full flex-col gap-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Optional"
            className="w-full"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-6">
          <div className="flex w-full flex-col gap-1.5">
            <Label>Positions</Label>
            <ToggleGroup
              type="multiple"
              variant="outline"
              value={form.positions}
              onValueChange={(value) => update('positions', value as PlayerPosition[])}
              className="w-full"
            >
              {POSITIONS.map(({ value, label }) => (
                <ToggleGroupItem key={value} value={value} className="flex-1">
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="flex w-full flex-col gap-1.5">
            <Label htmlFor="jersey_number">Jersey number</Label>
            <Input
              id="jersey_number"
              type="number"
              inputMode="numeric"
              placeholder="Optional"
              className="w-full"
              value={form.jersey_number}
              onChange={(e) => update('jersey_number', e.target.value)}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="flex w-full flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Optional"
              className="w-full"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>
          <div className="flex w-full flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional"
              className="w-full"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {step > 0 && (
          <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
            Back
          </Button>
        )}
        {!isLastStep && (
          <Button type="button" onClick={handleContinue} className="flex-1">
            Continue
          </Button>
        )}
        <Button
          type="submit"
          variant={isLastStep ? 'default' : 'outline'}
          disabled={createPlayer.isPending || (step === 0 && !tier1Valid)}
          className="flex-1"
        >
          Save player
        </Button>
      </div>
    </form>
  );
}
