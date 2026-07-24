import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { eventsQueryOptions } from '@/api/queries';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const WEEKDAY_FORMAT = new Intl.DateTimeFormat(undefined, { weekday: 'short' });

// Local YYYY-MM-DD key — deliberately not toISOString(), which would shift
// the date near midnight in timezones behind UTC.
function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function nextDays(count: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return date;
  });
}

export function CalendarPage() {
  const { data: events = [], isLoading, error } = useQuery(eventsQueryOptions);

  const days = nextDays(7);
  const todayKey = dateKey(days[0]);
  const lastDayKey = dateKey(days[days.length - 1]);

  const eventCountByDay = new Map<string, number>();
  for (const event of events) {
    eventCountByDay.set(event.event_date, (eventCountByDay.get(event.event_date) ?? 0) + 1);
  }

  const futureCount = events.filter((event) => event.event_date > lastDayKey).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">Calendar</CardTitle>
        <CardDescription>Next 7 days.</CardDescription>
        <CardAction>
          <Button asChild size="sm">
            <Link to="/calendar/new">Create event</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              {days.map((day) => {
                const key = dateKey(day);
                const isToday = key === todayKey;
                const count = eventCountByDay.get(key) ?? 0;
                return (
                  <div
                    key={key}
                    className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg border border-border p-1.5 sm:p-2 ${
                      isToday ? 'bg-primary text-primary-foreground' : 'bg-card'
                    }`}
                  >
                    <span
                      className={`text-xs ${isToday ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                    >
                      {WEEKDAY_FORMAT.format(day)}
                    </span>
                    <span className="text-base font-semibold sm:text-lg">{day.getDate()}</span>
                    {count > 0 && (
                      <Badge variant={isToday ? 'secondary' : 'default'} className="px-1.5">
                        {count}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
            {futureCount > 0 && (
              <Badge variant="secondary" className="self-end">
                +{futureCount} more upcoming
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
