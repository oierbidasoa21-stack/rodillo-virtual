import type { Step } from '../workout/types';
import { ZONE_IDS, type ZoneId } from '../zones/zones';

export type SecByZone = Record<ZoneId, number>;

export function emptySecByZone(): SecByZone {
  return Object.fromEntries(ZONE_IDS.map((id) => [id, 0])) as SecByZone;
}

/** Planned seconds per zone, from step durations. */
export function plannedSecByZone(steps: readonly Step[]): SecByZone {
  const out = emptySecByZone();
  for (const step of steps) out[step.zoneId] += step.durationSec;
  return out;
}

/** Seconds actually ridden per zone, from per-step timings (same order as `steps`). */
export function actualSecByZone(
  steps: readonly Step[],
  actualSecByStep: readonly number[],
): SecByZone {
  const out = emptySecByZone();
  steps.forEach((step, i) => {
    out[step.zoneId] += actualSecByStep[i] ?? 0;
  });
  return out;
}
