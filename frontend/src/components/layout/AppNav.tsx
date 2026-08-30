import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

const NAV_LINKS = [
  { to: '/players', label: 'Players' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/seasons', label: 'Sezóny' },
] as const;

export function AppNav() {
  return (
    <nav className="flex gap-2">
      {NAV_LINKS.map(({ to, label }) => (
        <Button key={to} asChild variant="ghost" size="sm">
          <Link to={to} activeProps={{ className: 'bg-accent text-accent-foreground' }}>
            {label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
