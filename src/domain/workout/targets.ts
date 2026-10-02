import type { BlockTarget } from './types';

/** Half-width of the power band around a target (±5 %). */
export const POWER_BAND = 0.05;

/**
 * Target in watts: fixed watts as they are, % of FTP only with a known FTP.
 * Null for heart rate blocks or a % target without FTP.
 */
export function targetWatts(target: BlockTarget, ftpW: number | null): number | null {
  if (target.type === 'watts') return target.watts;
  if (target.type === 'power' && ftpW !== null) return (target.pctFtp / 100) * ftpW;
  return null;
}

/** Acceptable range around a power target, rounded to the watt. */
export function powerBand(watts: number): { minW: number; maxW: number } {
  return { minW: Math.round(watts * (1 - POWER_BAND)), maxW: Math.round(watts * (1 + POWER_BAND)) };
}

export type PowerStatus = 'below' | 'in' | 'above';

/** Whether measured power is inside the ±5 % band of the target. */
export function powerStatus(measuredW: number, targetW: number): PowerStatus {
  const { minW, maxW } = powerBand(targetW);
  if (measuredW < minW) return 'below';
  if (measuredW > maxW) return 'above';
  return 'in';
}
