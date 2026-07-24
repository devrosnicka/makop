import { useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCreateEvent, type NewEvent } from '@/api/mutations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { EVENT_TYPES } from './eventTypes';

const emptyForm: NewEvent = {
  event_type: '',
  title: '',
  event_date: '',
  start_time: '',
  address: '',
  description: '',
};

// One tier per step — see docs/specs/events-calendar.md. Tier 1 (type) and
// tier 2 (date) are required; tier 3 can be skipped by saving early.
const STEPS = [
  { title: 'Type' },
  { title: 'Date & time' },
  { title: 'Address & description' },
] as const;

export function NewEventForm() {
  const navigate = useNavigate();
  const createEvent = useCreateEvent();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<NewEvent>(emptyForm);
  const [showRequiredError, setShowRequiredError] = useState(false);

  const typeValid = form.event_type !== '';
  const dateValid = form.event_date.trim().length > 0;
  const formValid = typeValid && dateValid;
  const isLastStep = step === STEPS.length - 1;

  function update<K extends keyof NewEvent>(key: K, value: NewEvent[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleContinue() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!formValid) {
      setShowRequiredError(true);
      setStep(typeValid ? 1 : 0);
      return;
    }
    await createEvent.mutateAsync(form);
    navigate({ to: '/calendar' });
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

      {createEvent.error && (
        <Alert variant="destructive">
          <AlertDescription>{createEvent.error.message}</AlertDescription>
        </Alert>
      )}

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex w-full flex-col gap-1.5">
            <Label>Event type</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              value={form.event_type}
              onValueChange={(value) => update('event_type', (value as NewEvent['event_type']) || '')}
              className="w-full"
            >
              {EVENT_TYPES.map(({ value, label }) => (
                <ToggleGroupItem key={value} value={value} className="flex-1">
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="flex w-full flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              autoFocus
              placeholder="Optional"
              className="w-full"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
            />
          </div>
          {showRequiredError && !typeValid && (
            <p className="text-sm text-destructive">Event type is required.</p>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="flex w-full flex-col gap-1.5">
            <Label htmlFor="event_date">Date</Label>
            <Input
              id="event_date"
              type="date"
              className="w-full"
              value={form.event_date}
              onChange={(e) => update('event_date', e.target.value)}
              required
            />
          </div>
          <div className="flex w-full flex-col gap-1.5">
            <Label htmlFor="start_time">Time</Label>
            <Input
              id="start_time"
              type="time"
              placeholder="Optional — leave blank for all-day"
              className="w-full"
              value={form.start_time}
              onChange={(e) => update('start_time', e.target.value)}
            />
          </div>
          {showRequiredError && !dateValid && (
            <p className="text-sm text-destructive">Date is required.</p>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div className="flex w-full flex-col gap-1.5">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="Optional"
              className="w-full"
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
            />
          </div>
          <div className="flex w-full flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional"
              className="w-full"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
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
          disabled={createEvent.isPending || !formValid}
          className="flex-1"
        >
          Save event
        </Button>
      </div>
    </form>
  );
}
