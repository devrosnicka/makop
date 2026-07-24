import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { eventsQueryOptions } from '@/api/queries';
import { eventTypeLabel } from '@/components/events/eventTypes';
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

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

// Local YYYY-MM-DD key — deliberately not toISOString(), which would shift
// the date near midnight in timezones behind UTC.
function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parses a YYYY-MM-DD event_date as a local midnight Date — new
// Date("YYYY-MM-DD") parses as UTC midnight instead, which would drift a day
// in negative-UTC-offset timezones.
function parseLocalDate(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function relativeDayLabel(date: Date, today: Date): string {
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return `in ${diffDays} days`;
}

function formatTime(startTime: string | null): string {
  return startTime ? startTime : 'All day';
}

export function CalendarPage() {
  const { data: events = [], isLoading, error } = useQuery(eventsQueryOptions);
  const [index, setIndex] = useState(0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = dateKey(today);

  const upcoming = events.filter((event) => event.event_date >= todayKey);
  const safeIndex = upcoming.length === 0 ? 0 : Math.min(index, upcoming.length - 1);
  const event = upcoming[safeIndex];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">Calendar</CardTitle>
        <CardDescription>Upcoming events.</CardDescription>
        <CardAction>
          <Button asChild size="sm">
            <Link to="/calendar/new">Create event</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !event ? (
          <p className="text-sm text-muted-foreground">No upcoming events.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 rounded-xl bg-primary p-5 text-primary-foreground sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="text-xs font-bold tracking-widest uppercase">Next event</span>
                <span className="shrink-0 rounded-full bg-background px-3 py-1 text-xs font-bold tracking-wide whitespace-nowrap text-foreground uppercase">
                  {eventTypeLabel(event.event_type)}
                </span>
              </div>

              <h3 className="min-w-0 font-display text-3xl leading-[1.05] font-black break-words uppercase sm:text-4xl">
                {event.title || eventTypeLabel(event.event_type)}
              </h3>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold sm:text-base">
                <span>{DATE_FORMAT.format(parseLocalDate(event.event_date))}</span>
                <span>·</span>
                <span>{formatTime(event.start_time)}</span>
                {event.address && (
                  <>
                    <span>·</span>
                    <span className="min-w-0 break-words">{event.address}</span>
                  </>
                )}
              </div>

              {event.description && (
                <p className="min-w-0 text-sm break-words whitespace-pre-wrap text-primary-foreground/70">
                  {event.description}
                </p>
              )}

              <div className="flex items-center justify-between gap-2 rounded-full bg-background px-4 py-2.5 text-foreground">
                <span className="text-xs font-bold tracking-widest text-primary uppercase">
                  Remaining
                </span>
                <span className="text-base font-black uppercase sm:text-lg">
                  {relativeDayLabel(parseLocalDate(event.event_date), today)}
                </span>
              </div>
            </div>

            {upcoming.length > 1 && (
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeIndex === 0}
                  onClick={() => setIndex(safeIndex - 1)}
                >
                  ‹ Prev
                </Button>
                <span className="text-sm text-muted-foreground">
                  {safeIndex + 1} of {upcoming.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeIndex === upcoming.length - 1}
                  onClick={() => setIndex(safeIndex + 1)}
                >
                  Next ›
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
