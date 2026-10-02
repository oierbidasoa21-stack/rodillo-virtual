/** Converts a heart rate counted over 10 seconds to beats per minute. */
export function hrPer10sToBpm(beatsPer10s: number): number {
  return beatsPer10s * 6;
}
