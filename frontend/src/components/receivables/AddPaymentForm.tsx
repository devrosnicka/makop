import { useState, type FormEvent } from 'react';
import type { Receivable } from '@/api/queries';
import { useAddPayment } from '@/api/mutations';
import { formatCzk, parseAmount } from '@/lib/money';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { remainingOf, todayInputValue } from './status';

/**
 * AC3 — recording one of possibly several payments against a receivable. The
 * amount starts at whatever is still owed (the common case: paying it off),
 * but stays editable for instalments and overpayments.
 */
export function AddPaymentForm({ receivable }: { receivable: Receivable }) {
  const remaining = remainingOf(receivable);
  const addPayment = useAddPayment(receivable.id);

  const [amount, setAmount] = useState(remaining > 0 ? String(remaining) : '');
  const [paidAt, setPaidAt] = useState(todayInputValue());
  const [note, setNote] = useState('');

  const isValid = parseAmount(amount) > 0 && paidAt !== '';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;

    await addPayment.mutateAsync({ amount: parseAmount(amount), paid_at: paidAt, note });
    // Back to "the rest of it" for the next instalment; the refetched
    // receivable drives what that is on the next render.
    setAmount('');
    setNote('');
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
      <h3 className="text-sm font-medium">
        Zapsat platbu{remaining > 0 && ` · zbývá ${formatCzk(remaining)}`}
      </h3>

      {addPayment.error && (
        <Alert variant="destructive">
          <AlertDescription>{addPayment.error.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex w-full flex-col gap-1.5">
          <Label htmlFor="payment_amount">Částka (Kč)</Label>
          <Input
            id="payment_amount"
            type="number"
            inputMode="numeric"
            min="1"
            className="w-full"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="flex w-full flex-col gap-1.5">
          <Label htmlFor="paid_at">Datum platby</Label>
          <Input
            id="paid_at"
            type="date"
            className="w-full"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex w-full flex-col gap-1.5">
        <Label htmlFor="note">Poznámka (nepovinné)</Label>
        <Input
          id="note"
          className="w-full"
          placeholder="Hotově / převodem"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={!isValid || addPayment.isPending}>
        Přidat platbu
      </Button>
    </form>
  );
}
