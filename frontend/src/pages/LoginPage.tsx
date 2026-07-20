import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { loginRoute } from '@/router';

// Google login redirects back here with ?error=denied (not on the
// allowlist) or ?error=oauth_failed (flow itself broke). See
// backend/src/routes/auth.ts and docs/specs/manager-auth.md. The search
// param is typed/validated by the route definition (src/router.tsx).
function loginErrorMessage(error: 'denied' | 'oauth_failed' | undefined): string | null {
  if (error === 'denied') return 'That Google account is not authorized for makop.';
  if (error === 'oauth_failed') return 'Google sign-in failed. Please try again.';
  return null;
}

export function LoginPage() {
  const { error } = loginRoute.useSearch();
  const loginError = loginErrorMessage(error);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-bold">Manager sign-in</h2>
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
