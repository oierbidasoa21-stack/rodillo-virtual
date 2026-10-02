import type { CscMeasurement, RevolutionData } from './parse/csc';

/** With no new revolution for this long, the wheel or crank is considered stopped. */
export const CSC_STOP_AFTER_MS = 3000;
/** Anything above these is a glitch (e.g. a sensor reset), not a real value. */
export const MAX_SPEED_KMH = 120;
export const MAX_CADENCE_RPM = 250;

const TICKS_PER_SEC = 1024;
const TIME_MOD = 2 ** 16;
const WHEEL_REVS_MOD = 2 ** 32;
const CRANK_REVS_MOD = 2 ** 16;

interface Channel {
  revs: number;
  eventTime: number;
  lastChangeMs: number;
  /** Null until two distinct events have been seen. */
  value: number | null;
}

/** Revolutions and seconds since the previous event, handling counter wrap-around. */
function delta(prev: Channel, cur: RevolutionData, revsMod: number) {
  return {
    revs: (cur.revs - prev.revs + revsMod) % revsMod,
    sec: ((cur.eventTime - prev.eventTime + TIME_MOD) % TIME_MOD) / TICKS_PER_SEC,
  };
}

function step(
  prev: Channel | null,
  cur: RevolutionData,
  nowMs: number,
  revsMod: number,
  toValue: (revs: number, sec: number) => number,
  max: number,
): Channel {
  if (!prev) return { ...cur, lastChangeMs: nowMs, value: null };
  const d = delta(prev, cur, revsMod);
  if (d.revs === 0 || d.sec === 0) {
    // No new revolution: keep the last value until it's clearly stopped.
    const stopped = nowMs - prev.lastChangeMs >= CSC_STOP_AFTER_MS;
    return { ...prev, value: stopped ? 0 : prev.value };
  }
  const value = toValue(d.revs, d.sec);
  // An impossible value means the counters jumped: restart from here, keep the old value.
  if (value > max) return { ...cur, lastChangeMs: nowMs, value: prev.value };
  return { ...cur, lastChangeMs: nowMs, value };
}

/**
 * Turns successive CSC measurements into speed and cadence.
 * Speed = Δwheel revs × circumference / Δt; cadence = Δcrank revs × 60 / Δt.
 */
export class CscCalculator {
  private wheel: Channel | null = null;
  private crank: Channel | null = null;

  constructor(private circumferenceMm: number) {}

  setCircumference(mm: number): void {
    this.circumferenceMm = mm;
  }

  update(m: CscMeasurement, nowMs: number): { speedKmh: number | null; cadenceRpm: number | null } {
    const metres = this.circumferenceMm / 1000;
    this.wheel = m.wheel
      ? step(
          this.wheel,
          m.wheel,
          nowMs,
          WHEEL_REVS_MOD,
          (r, s) => ((r * metres) / s) * 3.6,
          MAX_SPEED_KMH,
        )
      : null;
    this.crank = m.crank
      ? step(this.crank, m.crank, nowMs, CRANK_REVS_MOD, (r, s) => (r * 60) / s, MAX_CADENCE_RPM)
      : null;
    return { speedKmh: this.wheel?.value ?? null, cadenceRpm: this.crank?.value ?? null };
  }
}
