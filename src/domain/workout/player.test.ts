import { describe, expect, it } from 'vitest';
import type { HrZone } from '../zones/zones';
import { expandWorkout } from './expand';
import {
  type PlayerEvent,
  type PlayerState,
  actualDurationSec,
  addCount,
  createPlayer,
  extendCurrent,
  finish,
  progress,
  skip,
  tick,
  togglePlay,
} from './player';
import { makeBlock } from './types';

// 60 s L1, 20 s UA, 10 s L1
const steps = expandWorkout([
  makeBlock(60, 'L1', 'warm'),
  makeBlock(20, 'UA', 'work'),
  makeBlock(10, 'L1', 'cool'),
]);

const started = (): PlayerState => togglePlay(createPlayer(steps)).state;

/** Ticks in 0.2 s increments like the UI, collecting every event. */
function run(state: PlayerState, seconds: number): { state: PlayerState; events: PlayerEvent[] } {
  const events: PlayerEvent[] = [];
  let s = state;
  for (let i = 0; i < Math.round(seconds / 0.2); i++) {
    const t = tick(s, 0.2);
    s = t.state;
    events.push(...t.events);
  }
  return { state: s, events };
}

const types = (events: PlayerEvent[]) =>
  events.map((e) => (e.type === 'countdown' ? `countdown${e.remainingSec}` : e.type));

describe('player', () => {
  it('rejects an empty workout', () => {
    expect(() => createPlayer([])).toThrow();
  });

  it('emits started only on the first play, then pauses and resumes', () => {
    const first = togglePlay(createPlayer(steps));
    expect(types(first.events)).toEqual(['started']);
    const paused = togglePlay(first.state);
    expect(paused.state.status).toBe('paused');
    const resumed = togglePlay(paused.state);
    expect(resumed.state.status).toBe('running');
    expect(resumed.events).toEqual([]);
  });

  it('does not advance while ready or paused', () => {
    expect(tick(createPlayer(steps), 5).state.elapsedInStepSec).toBe(0);
    const paused = togglePlay(started()).state;
    expect(tick(paused, 5).state.elapsedInStepSec).toBe(0);
  });

  it('warns 10 s before the end, counts down 3-2-1 and changes step', () => {
    const { state, events } = run(started(), 60);
    expect(types(events)).toEqual([
      'warn10s',
      'countdown3',
      'countdown2',
      'countdown1',
      'stepChanged',
    ]);
    const warn = events[0];
    expect(warn?.type === 'warn10s' && warn.next?.target).toEqual({ type: 'hr', zoneId: 'UA' });
    expect(state.index).toBe(1);
  });

  it('skips the 10 s warning on steps of 15 s or less', () => {
    const short = togglePlay(
      createPlayer(expandWorkout([makeBlock(15, 'L1'), makeBlock(15, 'L2')])),
    );
    expect(types(run(short.state, 15).events)).not.toContain('warn10s');
  });

  it('finishes after the last step and records actual time', () => {
    const { state, events } = run(started(), 90);
    expect(state.status).toBe('finished');
    expect(types(events).at(-1)).toBe('finished');
    expect(actualDurationSec(state)).toBeCloseTo(90, 6);
  });

  it('carries a long gap across steps instead of losing it', () => {
    // 75 s in one tick: 60 s in step 0, 15 s in step 1
    const { state } = tick(started(), 75);
    expect(state.index).toBe(1);
    expect(state.elapsedInStepSec).toBe(15);
    expect(state.actualSecByStep).toEqual([60, 15, 0]);
  });

  it('extends the current step by a minute and re-arms the warning', () => {
    const near = run(started(), 52).state; // 8 s left, already warned
    expect(near.warned10s).toBe(true);
    const extended = extendCurrent(near).state;
    expect(extended.steps[0]?.durationSec).toBe(120);
    expect(extended.warned10s).toBe(false);
    expect(progress(extended).remainingInStepSec).toBeCloseTo(68, 6);
  });

  it('skips manually, keeping the time already ridden', () => {
    const mid = run(started(), 30).state;
    const { state, events } = skip(mid);
    expect(state.index).toBe(1);
    expect(events[0]).toMatchObject({ type: 'stepChanged', manual: true, index: 1 });
    expect(state.actualSecByStep[0]).toBeCloseTo(30, 6);
  });

  it('finishes when skipping the last step or on demand', () => {
    const last = skip(skip(started()).state).state;
    expect(types(skip(last).events)).toEqual(['finished']);
    expect(finish(started()).state.status).toBe('finished');
    expect(finish(finish(started()).state).events).toEqual([]);
  });

  it('reports progress over the planned timeline', () => {
    const s = run(started(), 70).state; // 60 s step done + 10 s into the 20 s step
    expect(progress(s)).toEqual({
      totalSec: 90,
      doneSec: expect.closeTo(70, 6),
      remainingTotalSec: expect.closeTo(20, 6),
      remainingInStepSec: expect.closeTo(10, 6),
    });
  });

  it('records hand counts against the target zone', () => {
    const ua: HrZone = { id: 'UA', label: 'UA', min: 26, max: 27 };
    const s = addCount(tick(started(), 65).state, 28, ua);
    expect(s.counts).toEqual([{ atSec: 65, valuePer10s: 28, targetZoneId: 'UA', status: 'above' }]);
  });
});
