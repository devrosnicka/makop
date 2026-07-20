// Thin fetch wrapper shared by all API calls (via TanStack Query hooks in
// src/api/queries.ts and src/api/mutations.ts — see ADR 0005). Always sends
// the session cookie (see docs/decisions/0003-manager-authentication.md) so
// protected routes work without any manual header wiring.
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: options.body
      ? { 'Content-Type': 'application/json', ...options.headers }
      : options.headers,
  });

  if (!res.ok) {
    // Backend routes send { error: "..." } bodies for expected failures
    // (e.g. validation) — surface that instead of a generic status message
    // when it's there.
    const message = await res
      .json()
      .then((body: unknown) =>
        typeof body === 'object' && body !== null && 'error' in body
          ? String((body as { error: unknown }).error)
          : null,
      )
      .catch(() => null);
    throw new Error(message ?? `${options.method ?? 'GET'} ${path} failed: ${res.status}`);
  }

  // 204 No Content (e.g. DELETE responses) has no body to parse.
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
