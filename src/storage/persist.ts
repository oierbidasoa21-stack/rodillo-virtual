/**
 * - `persisted`: the browser won't evict our data under storage pressure.
 * - `best-effort`: the browser said no (or hasn't decided); data stays, without that guarantee.
 * - `unsupported`: the Storage API isn't available.
 */
export type StoragePersistence = 'persisted' | 'best-effort' | 'unsupported';

/** Asks the browser to keep IndexedDB (workouts, history, settings) when space runs low. */
export async function requestPersistentStorage(): Promise<StoragePersistence> {
  const storage = typeof navigator === 'undefined' ? undefined : navigator.storage;
  if (!storage?.persist || !storage.persisted) return 'unsupported';
  try {
    if (await storage.persisted()) return 'persisted';
    return (await storage.persist()) ? 'persisted' : 'best-effort';
  } catch {
    return 'best-effort';
  }
}
