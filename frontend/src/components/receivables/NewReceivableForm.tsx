import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { playersQueryOptions } from '@/api/queries';
import { useCreateReceivable } from '@/api/mutations';
import { parseAmount } from '@/lib/money';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

/**
 * AC1 — creating a receivable by hand (jerseys, fines, anything ad hoc).
 * A single-step form rather than the season wizard's multi-step shape: there
 * are only five fields and none of them depend on each other.
 */
export function NewReceivableForm() {
  const navigate = useNavigate();
  const { data: players = [], isLoading } = useQuery(playersQueryOptions);
  const createReceivable = useCreateReceivable();

  const [playerId, setPlayerId] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  const isValid = playerId !== '' && title.trim().length > 0 && parseAmount(amount) > 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;

    const receivable = await createReceivable.mutateAsync({
      player_id: Number(playerId),
      title: title.trim(),
      amount: parseAmount(amount),
      due_date: dueDate,
      description,
    });
    navigate({
      to: '/receivables/$receivableId',
      params: { receivableId: String(receivable.id) },
    });
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-6">
      {createReceivable.error && (
        <Alert variant="destructive">
          <AlertDescription>{createReceivable.error.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex w-full flex-col gap-1.5">
        <Label htmlFor="player">Hráč</Label>
        <Select value={playerId} onValueChange={setPlayerId}>
          <SelectTrigger id="player" className="w-full">
            <SelectValue placeholder={isLoading ? 'Načítání…' : 'Vyber hráče'} />
          </SelectTrigger>
          <SelectContent>
            {players.map((player) => (
              <SelectItem key={player.id} value={String(player.id)}>
                {player.first_name} {player.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isLoading && players.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Zatím nejsou žádní hráči — nejdřív je přidej do soupisky.
          </p>
        )}
      </div>

      <div className="flex w-full flex-col gap-1.5">
        <Label htmlFor="title">Název pohledávky</Label>
        <Input
          id="title"
          className="w-full"
          placeholder="Dres"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="flex w-full flex-col gap-1.5">
        <Label htmlFor="amount">Částka (Kč)</Label>
        <Input
          id="amount"
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
        <Label htmlFor="due_date">Splatnost (nepovinné)</Label>
        <Input
          id="due_date"
          type="date"
          className="w-full"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div className="flex w-full flex-col gap-1.5">
        <Label htmlFor="description">Poznámka (nepovinné)</Label>
        <Textarea
          id="description"
          className="w-full"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={!isValid || createReceivable.isPending}>
        Vytvořit pohledávku
      </Button>
    </form>
  );
}
