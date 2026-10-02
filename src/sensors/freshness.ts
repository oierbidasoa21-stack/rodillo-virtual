/** Readings older than this are not shown or recorded (as in v1). */
export const MAX_READING_AGE_MS = 5000;

/** Whether a reading is recent enough to trust. */
export function isFresh(
  reading: { atMs: number } | null | undefined,
  nowMs: number,
  maxAgeMs = MAX_READING_AGE_MS,
): boolean {
  return !!reading && nowMs - reading.atMs <= maxAgeMs && nowMs >= reading.atMs;
}
