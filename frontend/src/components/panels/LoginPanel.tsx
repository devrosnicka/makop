import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// Google login redirects back here with ?error=denied (not on the
// allowlist) or ?error=oauth_failed (flow itself broke). See
// backend/src/routes/auth.ts and docs/specs/manager-auth.md.
function loginErrorMessage(): string | null {
  const error = new URLSearchParams(window.location.search).get('error');
  if (error === 'denied') return 'That Google account is not authorized for makop.';
  if (error === 'oauth_failed') return 'Google sign-in failed. Please try again.';
  return null;
}

export function LoginPanel() {
  const loginError = loginErrorMessage();
  return (
    <div className="flex flex-col gap-3">
      {loginError && (
        <Alert variant="destructive">
          <AlertDescription>{loginError}</AlertDescription>
        </Alert>
      )}
      <Button asChild className="self-start">
        <a href="/api/auth/google">Sign in with Google</a>
      </Button>
    </div>
  );
}
