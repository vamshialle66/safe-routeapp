export type LiveResult<T> = { ok: true; data: T } | { ok: false; reason: string };

/** A failed real search must never become an invented journey or place. */
export function requireLiveData<T>(result: LiveResult<T>): T {
  if (!result.ok) throw new Error(result.reason);
  return result.data;
}