import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useCreateSeason } from '@/api/mutations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function NewSeasonPage() {
  const navigate = useNavigate();
  const createSeason = useCreateSeason();
  const [name, setName] = useState('');

  const isValid = name.trim().length > 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;
    const season = await createSeason.mutateAsync(name.trim());
    navigate({ to: '/seasons/$seasonId', params: { seasonId: String(season.id) } });
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Nová sezóna</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-6">
          {createSeason.error && (
            <Alert variant="destructive">
              <AlertDescription>{createSeason.error.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex w-full flex-col gap-1.5">
            <Label htmlFor="name">Název sezóny</Label>
            <Input
              id="name"
              autoFocus
              className="w-full"
              placeholder="Podzim 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={!isValid || createSeason.isPending}>
            Založit sezónu
          </Button>
        </form>
        <Button asChild variant="ghost" size="sm" className="self-center">
          <Link to="/seasons">Zrušit</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
