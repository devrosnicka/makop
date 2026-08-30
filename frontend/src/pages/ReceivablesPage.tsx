import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { receivablesQueryOptions, type ReceivableFilter } from '@/api/queries';
import { DebtorList } from '@/components/receivables/DebtorList';
import { ReceivableRow } from '@/components/receivables/ReceivableRow';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// "Nezaplacené" is the working view; "vše" is for looking something up after
// it's been settled or cancelled.
const FILTERS: { value: ReceivableFilter; label: string }[] = [
  { value: 'open', label: 'Nezaplacené' },
  { value: 'all', label: 'Vše' },
];

export function ReceivablesPage() {
  const [filter, setFilter] = useState<ReceivableFilter>('open');
  const { data: receivables = [], isLoading, error } = useQuery(receivablesQueryOptions(filter));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">Pohledávky</CardTitle>
        <CardDescription>Co kdo dluží týmu a co už zaplatil.</CardDescription>
        <CardAction>
          <Button asChild size="sm">
            <Link to="/receivables/new">Nová pohledávka</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="receivables" className="gap-6">
          <TabsList className="w-full">
            <TabsTrigger value="receivables">Pohledávky</TabsTrigger>
            <TabsTrigger value="debtors">Dlužníci</TabsTrigger>
          </TabsList>

          <TabsContent value="receivables" className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={filter === option.value ? 'default' : 'outline'}
                  onClick={() => setFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Načítání…</p>
            ) : receivables.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {filter === 'open' ? 'Nic neuhrazeného. 🎉' : 'Zatím žádné pohledávky.'}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {receivables.map((receivable) => (
                  <ReceivableRow key={receivable.id} receivable={receivable} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="debtors">
            <DebtorList />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
