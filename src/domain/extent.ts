/**
 * Smallest and largest value of a list, with a plain loop. Spreading a long
 * list into `Math.min(...xs)` / `Math.max(...xs)` passes every value as an
 * argument and overflows the call stack past ~100 000 values (a 160 km route
 * has 160 000 path points; a 6 h ride over 20 000 samples). `Infinity` and
 * `-Infinity` for an empty list, like `Math.min()` and `Math.max()`.
 */
export function extent(values: Iterable<number>): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max };
}

/** Largest value of a list, or null when it is empty. Safe for long lists (see `extent`). */
export function maxOf(values: readonly number[]): number | null {
  return values.length ? extent(values).max : null;
}
