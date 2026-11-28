import { describe, expect, it } from 'vitest';
import { HR_CAP_REPEAT_SEC, hrCapTick, startHrCapAlarm } from './hrCapAlarm';

/** Runs the alarm once a second over a list of states; returns the seconds it sounded. */
function run(states: (boolean | null)[]): number[] {
  let s = startHrCapAlarm();
  const out: number[] = [];
  states.forEach((above, t) => {
    const r = hrCapTick(s, t, above);
    s = r.state;
    if (r.alert) out.push(t);
  });
  return out;
}

describe('heart rate ceiling alarm', () => {
  it('sounds at once and every 10 s while over', () => {
    expect(HR_CAP_REPEAT_SEC).toBe(10);
    expect(run([false, true, true, ...Array(20).fill(true)])).toEqual([1, 11, 21]);
  });

  it('rearms under the ceiling, and a new crossing sounds at once', () => {
    expect(run([true, true, false, true])).toEqual([0, 3]);
  });

  it('stays quiet without a reading', () => {
    expect(run([null, null, true])).toEqual([2]);
  });
});
