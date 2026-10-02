/**
 * Power metrics over 1 Hz samples (one value in watts per second with a reading).
 * Formulas from CLAUDE.md.
 */

/** Rolling mean of `windowSec` samples; empty if there aren't enough. */
function rollingMeans(samples: readonly number[], windowSec: number): number[] {
  if (samples.length < windowSec) return [];
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] ?? 0;
    if (i >= windowSec) sum -= samples[i - windowSec] ?? 0;
    if (i >= windowSec - 1) out.push(sum / windowSec);
  }
  return out;
}

export function averagePowerW(samples: readonly number[]): number | null {
  if (!samples.length) return null;
  return samples.reduce((a, b) => a + b, 0) / samples.length;
}

export function maxPowerW(samples: readonly number[]): number | null {
  return samples.length ? Math.max(...samples) : null;
}

/** NP: 30 s rolling mean, raised to the 4th, averaged, 4th root. Null under 30 s. */
export function normalizedPowerW(samples: readonly number[]): number | null {
  const rolling = rollingMeans(samples, 30);
  if (!rolling.length) return null;
  const mean4 = rolling.reduce((a, p) => a + p ** 4, 0) / rolling.length;
  return mean4 ** 0.25;
}

/** IF = NP / FTP. */
export function intensityFactor(npW: number, ftpW: number): number {
  return npW / ftpW;
}

/** TSS = (s · NP · IF) / (FTP · 3600) · 100. */
export function trainingStressScore(durationSec: number, npW: number, ftpW: number): number {
  return ((durationSec * npW * intensityFactor(npW, ftpW)) / (ftpW * 3600)) * 100;
}

/** Work done in kJ (1 W for 1 s = 1 J). */
export function kilojoules(samples: readonly number[]): number {
  return samples.reduce((a, b) => a + b, 0) / 1000;
}

/** Best mean power over any `windowSec` stretch, e.g. the best minute. */
export function bestAverageW(samples: readonly number[], windowSec: number): number | null {
  const rolling = rollingMeans(samples, windowSec);
  return rolling.length ? Math.max(...rolling) : null;
}
