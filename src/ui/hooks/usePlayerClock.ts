import { useEffect, useRef } from 'react';

/**
 * Calls `onTick` with the real elapsed seconds (from performance.now) every
 * `intervalMs` while `running`. Measuring instead of assuming the interval
 * keeps time right when the browser throttles timers.
 */
export function usePlayerClock(
  running: boolean,
  onTick: (dtSec: number) => void,
  intervalMs = 200,
): void {
  const callback = useRef(onTick);
  useEffect(() => {
    callback.current = onTick;
  });

  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      callback.current((now - last) / 1000);
      last = now;
    }, intervalMs);
    return () => clearInterval(id);
  }, [running, intervalMs]);
}
