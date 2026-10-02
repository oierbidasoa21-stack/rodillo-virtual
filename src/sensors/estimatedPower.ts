import { type TrainerCurve, trainerPowerW } from '../domain/trainer/curves';
import { isFresh } from './freshness';
import type { CscReading } from './types';

/**
 * Watts estimated from the wheel speed and the trainer's curve. Null without a
 * curve, without a fresh speed reading, or from a sensor that sends no speed:
 * no power is ever made up.
 */
export function estimatePowerW(
  csc: CscReading | null,
  curve: TrainerCurve | null,
  nowMs: number,
): number | null {
  if (!curve || !csc || !isFresh(csc, nowMs) || csc.speedKmh === null) return null;
  return trainerPowerW(curve, csc.speedKmh);
}
