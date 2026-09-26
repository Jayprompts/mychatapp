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

// Called when a signed-in request comes back 401 (session expired, or ended elsewhere) — the auth
// feature re-checks the session and shows "Session expired". /auth/* answers 401 by design, so skip it.
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => void (onUnauthorized = fn);

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

  if (res.status === 401 && !path.startsWith('/auth/')) onUnauthorized?.();
  if (!json) throw new ApiError(res.status, `Unexpected response from server (${res.status})`);
  if (!json.success) throw new ApiError(res.status, json.error.message, json.error.details);
  return json.data;
}

// Friendly message for any thrown value (for alerts/toasts).
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return 'Something went wrong. Please try again.';
}

// Multipart upload with progress (fetch can't report upload progress, XMLHttpRequest can).
export function upload<T>(path: string, form: FormData, onProgress?: (fraction: number) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api${path}`);
    xhr.withCredentials = true;
    xhr.responseType = 'json';
    if (onProgress) xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onerror = () => reject(new ApiError(0, "Can't reach the server. Check your connection and try again."));
    xhr.onload = () => {
      if (xhr.status === 401) onUnauthorized?.();
      const json = xhr.response as Envelope<T> | null;
      if (!json) return reject(new ApiError(xhr.status, `Unexpected response from server (${xhr.status})`));
      if (!json.success) return reject(new ApiError(xhr.status, json.error.message, json.error.details));
      resolve(json.data);
    };
    xhr.send(form);
  });
}
