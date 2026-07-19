import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';

export function SignedInPanel() {
  const { email, logout } = useAuth();
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{email}</span>
      </p>
      <Button variant="outline" size="sm" onClick={() => void logout()}>
        Log out
      </Button>
    </div>
  );
}
