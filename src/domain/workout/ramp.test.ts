import { describe, expect, it } from 'vitest';
import { expandWorkout, totalDurationSec } from './expand';
import { buildRampTest, ftpFromRamp, rampStepsCompleted } from './ramp';

const constant = (watts: number, sec: number) => Array.from({ length: sec }, () => watts);

describe('ramp test', () => {
  it('is 5′ at 100 W, then 1′ steps from 100 W to 600 W in 20 W increments', () => {
    const steps = expandWorkout(buildRampTest().blocks);
    expect(steps[0]).toMatchObject({ durationSec: 300, target: { type: 'watts', watts: 100 } });
    const ramp = steps.slice(1).map((s) => (s.target.type === 'watts' ? s.target.watts : NaN));
    expect(ramp.slice(0, 3)).toEqual([100, 120, 140]);
    expect(ramp.at(-1)).toBe(600);
    expect(ramp).toHaveLength(26); // (600 − 100) / 20 + 1
    expect(totalDurationSec(steps)).toBe(300 + 26 * 60);
  });

  it('FTP = 75 % of the best minute: 320 W → 240 W', () => {
    // … 280 W, 300 W, 320 W, then 20 s at 340 W before giving up
    const samples = [
      ...constant(280, 60),
      ...constant(300, 60),
      ...constant(320, 60),
      ...constant(340, 20),
    ];
    const result = ftpFromRamp(samples, 10);
    // Best 60 s window: last 40 s at 320 + 20 s at 340 = 326.7 W → FTP 245
    expect(result?.bestMinuteW).toBeCloseTo((40 * 320 + 20 * 340) / 60, 9);
    expect(result?.ftpW).toBe(245);
    expect(ftpFromRamp(constant(320, 60), 5)).toEqual({ bestMinuteW: 320, ftpW: 240 });
  });

  it('needs at least 3 full steps and a minute of power', () => {
    expect(ftpFromRamp(constant(200, 600), 2)).toBeNull();
    expect(ftpFromRamp(constant(200, 59), 3)).toBeNull();
  });

  it('counts completed ramp steps from the player position', () => {
    expect(rampStepsCompleted(0)).toBe(0); // warm-up
    expect(rampStepsCompleted(1)).toBe(0); // first step in progress
    expect(rampStepsCompleted(4)).toBe(3);
  });
});
