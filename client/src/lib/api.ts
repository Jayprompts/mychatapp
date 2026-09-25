// Thin fetch wrapper for our API. Every server response is { success, data } or { success, error }.
// Same-origin in dev (Vite proxy) and prod (Nginx), so the httpOnly auth cookie is sent automatically.

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  status: number;
  details?: FieldErrors;

  constructor(status: number, message: string, details?: FieldErrors) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type Envelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; details?: FieldErrors } };

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
};

export async function api<T>(path: string, { method = 'GET', body, signal }: ApiOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      signal,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  const json = (await res.json().catch(() => null)) as Envelope<T> | null;

  if (!json) throw new ApiError(res.status, `Unexpected response from server (${res.status})`);
  if (!json.success) throw new ApiError(res.status, json.error.message, json.error.details);
  return json.data;
}

// Friendly message for any thrown value (for alerts/toasts).
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return 'Something went wrong. Please try again.';
}
