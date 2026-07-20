import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Routing placeholder — the actual Calendar feature (see ROADMAP.md, "Events
// & calendar") isn't built yet and needs its own docs/specs entry first per
// CLAUDE.md. This page exists so /calendar is a real, navigable, protected
// route ahead of that work (see ADR 0005).
export function CalendarPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Not built yet — see ROADMAP.md.</p>
      </CardContent>
    </Card>
  );
}
