/** Fired when the API rejects the session so the page can show the access gate again. */
export const UNAUTHORIZED_EVENT = 'wavez:unauthorized';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

/** GET a `{ success, data }` endpoint and return `data`, throwing a readable error otherwise. */
export async function apiGet<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  const json = await res.json().catch(() => null);
  if (res.status === 401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  if (!res.ok || !json?.success) {
    throw new ApiError(json?.error || 'No se pudo conectar con el servidor', res.status);
  }
  return json.data as T;
}
