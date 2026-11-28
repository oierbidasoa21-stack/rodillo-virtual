/** The big countdown shows over the last seconds of each block. */
export const BIG_COUNTDOWN_SEC = 5;

/**
 * The digit of the big countdown (5, 4, 3, 2, 1) for the time left in the
 * block, or null outside the last 5 s or when the clock is not running.
 * Rounded up, like the clock: with 4.2 s left both show 5.
 */
export function bigCountdownDigit(remainingInStepSec: number, running: boolean): number | null {
  if (!running || !(remainingInStepSec > 0)) return null;
  const digit = Math.ceil(remainingInStepSec);
  return digit <= BIG_COUNTDOWN_SEC ? digit : null;
}
