import { bestAverageW } from '../metrics/power';
import { type Block, type Workout, makeBlock } from './types';

export const RAMP = {
  warmUpSec: 300,
  warmUpW: 100,
  startW: 100,
  stepW: 20,
  stepSec: 60,
  /** Far above anyone's limit: the test ends when the rider stops. */
  maxW: 600,
  /** FTP = this × best 1-minute power. */
  ftpFactor: 0.75,
  /** Fewer full steps than this is not a test. */
  minSteps: 3,
} as const;

export const RAMP_TEST_ID = 'ramp-test';

/** Standard ramp: 5′ easy, then +20 W every minute from 100 W until you can't hold it. */
export function buildRampTest(): Workout {
  const steps: Block[] = [];
  for (let w: number = RAMP.startW; w <= RAMP.maxW; w += RAMP.stepW) {
    steps.push(makeBlock(RAMP.stepSec, { type: 'watts', watts: w }, 'work'));
  }
  return {
    id: RAMP_TEST_ID,
    name: 'Ramp test',
    description:
      'Calentamiento de 5′ y después +20 W cada minuto desde 100 W, hasta que no puedas mantenerlo.',
    blocks: [
      makeBlock(RAMP.warmUpSec, { type: 'watts', watts: RAMP.warmUpW }, 'warm', 'Suave'),
      ...steps,
    ],
  };
}

export interface RampResult {
  /** Best mean power over 60 s. */
  bestMinuteW: number;
  ftpW: number;
}

/**
 * FTP estimate from a ramp test: 75 % of the best minute, rounded to the watt.
 * Null if fewer than 3 ramp steps were completed or there's no minute of power.
 */
export function ftpFromRamp(
  powerSamples: readonly number[],
  rampStepsCompleted: number,
): RampResult | null {
  if (rampStepsCompleted < RAMP.minSteps) return null;
  const best = bestAverageW(powerSamples, 60);
  if (best === null) return null;
  return { bestMinuteW: best, ftpW: Math.round(best * RAMP.ftpFactor) };
}

/** Full ramp steps done when the player is at `stepIndex` (0 = warm-up). */
export function rampStepsCompleted(stepIndex: number): number {
  return Math.max(0, stepIndex - 1);
}
