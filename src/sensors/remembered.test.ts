import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rememberSensor, rememberedSensor } from './remembered';

describe('remembered sensors', () => {
  beforeEach(() => {
    const data = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('remembers one id per kind and forgets it', () => {
    rememberSensor('hr', 'banda');
    rememberSensor('csc', 'rueda');
    expect(rememberedSensor('hr')).toBe('banda');
    rememberSensor('hr', null);
    expect(rememberedSensor('hr')).toBeNull();
    expect(rememberedSensor('csc')).toBe('rueda');
  });

  it('without storage (private window) remembers nothing and does not fail', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(() => rememberSensor('hr', 'banda')).not.toThrow();
    expect(rememberedSensor('hr')).toBeNull();
  });
});
