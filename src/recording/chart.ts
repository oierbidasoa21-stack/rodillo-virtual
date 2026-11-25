import type { RecordSample } from './recording';

export type ChartChannel = 'hr' | 'powerW' | 'speedKmh' | 'cadenceRpm' | 'altitudeM';

/** One plotted point: seconds into the session and the mean value of its bucket. */
export interface ChartPoint {
  t: number;
  v: number;
}

/**
 * Values of one channel for plotting, at most `maxPoints` of them. Neighbouring
 * seconds are averaged; a bucket with no reading is a gap (a new run), so the
 * line never bridges a time without data.
 */
export function chartRuns(
  samples: readonly RecordSample[],
  channel: ChartChannel,
  maxPoints: number,
): ChartPoint[][] {
  const size = Math.max(1, Math.ceil(samples.length / Math.max(1, maxPoints)));
  const runs: ChartPoint[][] = [];
  let run: ChartPoint[] = [];
  for (let i = 0; i < samples.length; i += size) {
    let sum = 0;
    let n = 0;
    let tSum = 0;
    for (let j = i; j < Math.min(i + size, samples.length); j++) {
      const s = samples[j];
      const v = s?.[channel];
      if (s && v !== null && v !== undefined) {
        sum += v;
        tSum += s.t;
        n++;
      }
    }
    if (n > 0) run.push({ t: tSum / n, v: sum / n });
    else if (run.length) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length) runs.push(run);
  return runs;
}

/** Min and max of a channel, or null if it has no reading. */
export function channelRange(
  samples: readonly RecordSample[],
  channel: ChartChannel,
): { min: number; max: number; avg: number } | null {
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let n = 0;
  for (const s of samples) {
    const v = s[channel];
    if (v === null) continue;
    min = Math.min(min, v);
    max = Math.max(max, v);
    sum += v;
    n++;
  }
  return n ? { min, max, avg: sum / n } : null;
}

/** Round axis ticks (1, 2 or 5 × 10ⁿ apart) covering [min, max], about `target` of them. */
export function niceTicks(min: number, max: number, target = 4): number[] {
  if (!(max > min)) {
    const v = Number.isFinite(min) ? min : 0;
    return [Math.floor(v) - 1, Math.floor(v) + 1];
  }
  const rough = (max - min) / Math.max(1, target);
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = ([1, 2, 5, 10].find((m) => m * pow >= rough) ?? 10) * pow;
  const ticks: number[] = [];
  for (let v = Math.floor(min / step) * step; v <= max + step * 1e-9; v += step) {
    ticks.push(Math.round(v * 1e6) / 1e6);
  }
  if ((ticks.at(-1) ?? -Infinity) < max) ticks.push((ticks.at(-1) ?? 0) + step);
  return ticks;
}
