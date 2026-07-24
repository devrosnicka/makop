import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NewEventForm } from '@/components/events/NewEventForm';

export function NewEventPage() {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Create event</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <NewEventForm />
        <Button asChild variant="ghost" size="sm" className="self-center">
          <Link to="/calendar">Cancel</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
