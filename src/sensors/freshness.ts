/** Readings older than this are not shown or recorded (as in v1). */
export const MAX_READING_AGE_MS = 5000;

/**
 * Whether a reading is recent enough to trust. A reading newer than `nowMs` counts
 * as fresh: the UI clock ticks once a second and often lags the latest reading.
 */
export function isFresh(
  reading: { atMs: number } | null | undefined,
  nowMs: number,
  maxAgeMs = MAX_READING_AGE_MS,
): boolean {
  return !!reading && nowMs - reading.atMs <= maxAgeMs;
}
