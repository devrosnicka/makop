import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { playersQueryOptions } from '@/api/queries';
import { useCreatePlayer, useDeletePlayer, type NewPlayer } from '@/api/mutations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const emptyNewPlayer: NewPlayer = {
  name: '',
  email: '',
  phone: '',
  jersey_number: '',
  position: '',
  notes: '',
};

const NEW_PLAYER_FIELDS: { key: keyof NewPlayer; label: string; placeholder: string }[] = [
  { key: 'name', label: 'Name', placeholder: 'Name' },
  { key: 'email', label: 'Email', placeholder: 'Email' },
  { key: 'phone', label: 'Phone', placeholder: 'Phone' },
  { key: 'jersey_number', label: 'Jersey #', placeholder: 'Jersey #' },
  { key: 'position', label: 'Position', placeholder: 'Position' },
  { key: 'notes', label: 'Notes', placeholder: 'Notes' },
];

export function PlayersPage() {
  const { data: players = [], isLoading, error: loadError } = useQuery(playersQueryOptions);
  const createPlayer = useCreatePlayer();
  const deletePlayer = useDeletePlayer();
  const [form, setForm] = useState<NewPlayer>(emptyNewPlayer);
  const [formError, setFormError] = useState<string | null>(null);

  const error = formError ?? loadError?.message ?? createPlayer.error?.message ?? deletePlayer.error?.message ?? null;

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (form.name.trim().length === 0) {
      setFormError('Name is required.');
      return;
    }
    setFormError(null);
    await createPlayer.mutateAsync(form);
    setForm(emptyNewPlayer);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">Player roster</CardTitle>
        <CardDescription>Team members and their contact details.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>#</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell>{player.jersey_number ?? '—'}</TableCell>
                  <TableCell>{player.position ?? '—'}</TableCell>
                  <TableCell>{player.email ?? '—'}</TableCell>
                  <TableCell>{player.phone ?? '—'}</TableCell>
                  <TableCell>{player.notes ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePlayer.mutate(player.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {players.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No players yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        <form
          onSubmit={(event) => void handleAdd(event)}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3"
        >
          {NEW_PLAYER_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label htmlFor={`player-${key}`}>{label}</Label>
              <Input
                id={`player-${key}`}
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={key === 'name'}
              />
            </div>
          ))}
          <Button
            type="submit"
            disabled={createPlayer.isPending}
            className="col-span-full sm:col-span-1 sm:self-end"
          >
            Add player
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
