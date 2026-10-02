/** Time source for simulated sensors, injectable so tests can drive it. */
export interface SimClock {
  now(): number;
  setInterval(fn: () => void, ms: number): unknown;
  clearInterval(id: unknown): void;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(id: unknown): void;
}

export const realClock: SimClock = {
  now: () => Date.now(),
  setInterval: (fn, ms) => globalThis.setInterval(fn, ms),
  clearInterval: (id) => globalThis.clearInterval(id as ReturnType<typeof setInterval>),
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (id) => globalThis.clearTimeout(id as ReturnType<typeof setTimeout>),
};

/** Fraction of the remaining gap closed in `dtSec` by a first-order lag with time constant `tauSec`. */
export function lagFactor(dtSec: number, tauSec: number): number {
  return 1 - Math.exp(-dtSec / tauSec);
}
