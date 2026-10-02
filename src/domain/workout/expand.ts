import type { Step, WorkoutItem } from './types';

/** Flattens repeats into a playable list of steps, dropping zero-length blocks. */
export function expandWorkout(blocks: readonly WorkoutItem[]): Step[] {
  const steps: Step[] = [];
  for (const item of blocks) {
    if (item.type === 'repeat') {
      for (let i = 1; i <= item.times; i++) {
        for (const block of item.items) {
          steps.push({ ...block, repeat: { index: i, times: item.times } });
        }
      }
    } else {
      steps.push({ ...item });
    }
  }
  return steps.filter((s) => s.durationSec > 0);
}

export function totalDurationSec(steps: readonly Step[]): number {
  return steps.reduce((sum, s) => sum + s.durationSec, 0);
}
