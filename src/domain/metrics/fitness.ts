import type { SessionSummary } from './summary';

/** Days the "condition" (chronic load) averages over. */
export const CONDITION_DAYS = 42;
/** Days the fatigue (acute load) averages over. */
export const FATIGUE_DAYS = 7;
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

/** One day of the fitness curve. */
export interface FitnessDay {
  /** Local midnight of the day. */
  dayMs: number;
  /** Load ridden that day. */
  load: number;
  /** Chronic load: exponential average over 42 days ("condición"). */
  condition: number;
  /** Acute load: exponential average over 7 days ("fatiga"). */
  fatigue: number;
  /** condition − fatigue: positive = fresh, negative = loaded ("frescura"). */
  freshness: number;
}

type FitnessInput = Pick<SessionSummary, 'dateMs' | 'load'> &
  Partial<Pick<SessionSummary, 'hrMeasured' | 'power' | 'durationSec'>>;

/**
 * Whether a session counts towards fitness: not when its heart rate or power
 * came from a simulated sensor (that load would be invented).
 */
export function countsForFitness(
  s: Partial<Pick<SessionSummary, 'hrMeasured' | 'power'>>,
): boolean {
  return !s.hrMeasured?.simulated && !s.power?.simulated;
}

/** Local midnight of the day `ms` falls in. */
export function dayStart(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** The next local midnight (also on daylight-saving days of 23 or 25 h). */
function nextDay(dayMs: number): number {
  return dayStart(dayMs + DAY_MS + 3 * HOUR_MS);
}

/**
 * The fitness curve (the classic chronic/acute training load model) from the
 * history, day by day from the first session up to `untilMs`, keeping the last
 * `days`. Each day: x ← x + (load − x) / N, with N = 42 or 7.
 */
export function fitnessCurve(
  sessions: readonly FitnessInput[],
  untilMs: number,
  days = 90,
): FitnessDay[] {
  const byDay = new Map<number, number>();
  for (const s of sessions) {
    if (!countsForFitness(s)) continue;
    const day = dayStart(s.dateMs);
    byDay.set(day, (byDay.get(day) ?? 0) + s.load);
  }
  const last = dayStart(untilMs);
  const first = Math.min(last, ...byDay.keys());
  const out: FitnessDay[] = [];
  let condition = 0;
  let fatigue = 0;
  for (let day = first; day <= last; day = nextDay(day)) {
    const load = byDay.get(day) ?? 0;
    condition += (load - condition) / CONDITION_DAYS;
    fatigue += (load - fatigue) / FATIGUE_DAYS;
    out.push({ dayMs: day, load, condition, fatigue, freshness: condition - fatigue });
  }
  // Pad the start so the curve always spans `days` (no history before = zero).
  while (out.length < days) {
    const firstDay = out[0]?.dayMs ?? last;
    out.unshift({
      dayMs: dayStart(firstDay - 12 * HOUR_MS),
      load: 0,
      condition: 0,
      fatigue: 0,
      freshness: 0,
    });
  }
  return out.slice(-days);
}

/** Totals of one week (Monday to Sunday). */
export interface WeekTotals {
  /** Local midnight of the Monday. */
  weekMs: number;
  load: number;
  durationSec: number;
  sessions: number;
}

/** Monday 00:00 of the week `ms` falls in. */
export function weekStart(ms: number): number {
  const d = new Date(dayStart(ms));
  const back = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - back);
  return d.getTime();
}

/** Load, time and sessions for each of the last `weeks` weeks, oldest first. */
export function weeklyTotals(
  sessions: readonly FitnessInput[],
  untilMs: number,
  weeks = 12,
): WeekTotals[] {
  const out: WeekTotals[] = [];
  const d = new Date(weekStart(untilMs));
  for (let i = 0; i < weeks; i++) {
    out.unshift({ weekMs: d.getTime(), load: 0, durationSec: 0, sessions: 0 });
    d.setDate(d.getDate() - 7);
  }
  for (const s of sessions) {
    if (!countsForFitness(s)) continue;
    const w = out.find((x) => x.weekMs === weekStart(s.dateMs));
    if (!w) continue;
    w.load += s.load;
    w.durationSec += s.durationSec ?? 0;
    w.sessions += 1;
  }
  return out;
}

export type FreshnessLevel = 'fresh' | 'balanced' | 'loaded' | 'overloaded';

/**
 * How to read the freshness. The load is minutes × zone weight (an hour in Z2
 * is 120), about twice the usual TSS scale, so the usual bands are doubled.
 * Orientative only.
 */
export function freshnessLevel(freshness: number): FreshnessLevel {
  if (freshness > 10) return 'fresh';
  if (freshness >= -20) return 'balanced';
  if (freshness >= -60) return 'loaded';
  return 'overloaded';
}
