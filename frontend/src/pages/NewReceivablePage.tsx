import { Link } from '@tanstack/react-router';
import { NewReceivableForm } from '@/components/receivables/NewReceivableForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function NewReceivablePage() {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Nová pohledávka</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <NewReceivableForm />
        <Button asChild variant="ghost" size="sm" className="self-center">
          <Link to="/receivables">Zrušit</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
