import { type HrZone, type ZoneId, findZone, toZoneId } from './zones';

/**
 * A heart rate ceiling for a session or a block: a number of beats per minute,
 * or "do not go above zone n" (the top of that zone).
 */
export type HrCap = { type: 'bpm'; bpm: number } | { type: 'zone'; zoneId: ZoneId };

/** Sensible bounds for a ceiling typed in ppm. */
export const HR_CAP_MIN_BPM = 80;
export const HR_CAP_MAX_BPM = 230;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Reads a stored or imported ceiling, or null for anything else. Old zone names
 * (L1…VO2) are accepted, as everywhere else.
 */
export function parseHrCap(raw: unknown): HrCap | null {
  if (!isRecord(raw)) return null;
  if (
    raw.type === 'bpm' &&
    typeof raw.bpm === 'number' &&
    raw.bpm >= HR_CAP_MIN_BPM &&
    raw.bpm <= HR_CAP_MAX_BPM
  ) {
    return { type: 'bpm', bpm: Math.round(raw.bpm) };
  }
  const zoneId = raw.type === 'zone' ? toZoneId(raw.zoneId) : null;
  return zoneId ? { type: 'zone', zoneId } : null;
}

/**
 * Whether `bpm` is over the ceiling. A zone ceiling is crossed when the pulse
 * counted in 10 s (ppm / 6, rounded) is above the top of the zone, the same way
 * a reading is put in a zone. A zone with no top (the last one) never is.
 */
export function isAboveCap(bpm: number, cap: HrCap, zones: readonly HrZone[]): boolean {
  if (cap.type === 'bpm') return bpm > cap.bpm;
  const max = findZone(zones, cap.zoneId).max;
  return max !== null && Math.round(bpm / 6) > max;
}

/** Highest ppm still under the ceiling, for display; null if it has no top. */
export function capTopBpm(cap: HrCap, zones: readonly HrZone[]): number | null {
  if (cap.type === 'bpm') return cap.bpm;
  const max = findZone(zones, cap.zoneId).max;
  // round(bpm / 6) ≤ max  ⇔  bpm < (max + 0.5) · 6
  return max === null ? null : Math.ceil((max + 0.5) * 6) - 1;
}

/** "máx. 162 ppm" or "máx. Z4 (≤ 164 ppm)". */
export function capLabel(cap: HrCap, zones: readonly HrZone[]): string {
  if (cap.type === 'bpm') return `máx. ${cap.bpm} ppm`;
  const top = capTopBpm(cap, zones);
  return top === null ? `máx. ${cap.zoneId}` : `máx. ${cap.zoneId} (≤ ${top} ppm)`;
}
