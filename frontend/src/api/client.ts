// Thin fetch wrapper shared by all API calls. Always sends the session
// cookie (see docs/decisions/0003-manager-authentication.md) so protected
// routes work without any manual header wiring.
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: options.body
      ? { 'Content-Type': 'application/json', ...options.headers }
      : options.headers,
  });

  if (!res.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} failed: ${res.status}`);
  }

  // 204 No Content (e.g. DELETE responses) has no body to parse.
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
