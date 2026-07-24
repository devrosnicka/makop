import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NewPlayerForm } from '@/components/players/NewPlayerForm';

export function NewPlayerPage() {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Add player</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <NewPlayerForm />
        <Button asChild variant="ghost" size="sm" className="self-center">
          <Link to="/players">Cancel</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
