import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestPersistentStorage } from './persist';

const withStorage = (storage: Partial<StorageManager> | undefined) =>
  vi.stubGlobal('navigator', { storage });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('requestPersistentStorage', () => {
  it('does not ask again when already persisted', async () => {
    const persist = vi.fn();
    withStorage({ persisted: async () => true, persist });
    expect(await requestPersistentStorage()).toBe('persisted');
    expect(persist).not.toHaveBeenCalled();
  });

  it('asks and reports the answer', async () => {
    withStorage({ persisted: async () => false, persist: async () => true });
    expect(await requestPersistentStorage()).toBe('persisted');
    withStorage({ persisted: async () => false, persist: async () => false });
    expect(await requestPersistentStorage()).toBe('best-effort');
  });

  it('treats errors as best effort', async () => {
    withStorage({
      persisted: async () => false,
      persist: () => Promise.reject(new Error('nope')),
    });
    expect(await requestPersistentStorage()).toBe('best-effort');
  });

  it('reports when the API is missing', async () => {
    withStorage(undefined);
    expect(await requestPersistentStorage()).toBe('unsupported');
  });
});
