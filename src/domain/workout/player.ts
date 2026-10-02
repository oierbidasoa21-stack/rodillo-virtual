import { type HrZone, type ZoneId, type ZoneStatus, zoneStatus } from '../zones/zones';
import { totalDurationSec } from './expand';
import type { Step } from './types';

/** Seconds before the end of a step when the next step is announced. */
export const WARN_AT_SEC = 10;
/** Steps this short or shorter get no 10-second warning (it would overlap the countdown). */
export const WARN_MIN_STEP_SEC = 15;
/** Seconds added to the current step by "+1′". */
export const EXTEND_SEC = 60;

export type PlayerStatus = 'ready' | 'running' | 'paused' | 'finished';

/** A heart rate counted by hand over 10 seconds during the session. */
export interface HrCount {
  /** Position in the planned timeline when the count was entered. */
  atSec: number;
  valuePer10s: number;
  targetZoneId: ZoneId;
  status: ZoneStatus;
}

export interface PlayerState {
  steps: Step[];
  index: number;
  elapsedInStepSec: number;
  /** Time actually spent in each step, including extensions and partial skipped steps. */
  actualSecByStep: number[];
  status: PlayerStatus;
  warned10s: boolean;
  lastCountdown: number | null;
  counts: HrCount[];
}

export type PlayerEvent =
  | { type: 'started'; step: Step }
  | { type: 'warn10s'; next: Step | null }
  | { type: 'countdown'; remainingSec: number }
  | { type: 'stepChanged'; step: Step; index: number; manual: boolean }
  | { type: 'finished' };

export interface Transition {
  state: PlayerState;
  events: PlayerEvent[];
}

const unchanged = (state: PlayerState): Transition => ({ state, events: [] });

export function createPlayer(steps: readonly Step[]): PlayerState {
  if (steps.length === 0) throw new Error('A workout needs at least one step');
  return {
    steps: steps.map((s) => ({ ...s })),
    index: 0,
    elapsedInStepSec: 0,
    actualSecByStep: steps.map(() => 0),
    status: 'ready',
    warned10s: false,
    lastCountdown: null,
    counts: [],
  };
}

export function currentStep(state: PlayerState): Step {
  const step = state.steps[state.index];
  if (!step) throw new Error(`No step at index ${state.index}`);
  return step;
}

export function nextStep(state: PlayerState): Step | null {
  return state.steps[state.index + 1] ?? null;
}

/** Start, pause or resume. Only the very first start emits `started`. */
export function togglePlay(state: PlayerState): Transition {
  switch (state.status) {
    case 'ready':
      return {
        state: { ...state, status: 'running' },
        events: [{ type: 'started', step: currentStep(state) }],
      };
    case 'running':
      return { state: { ...state, status: 'paused' }, events: [] };
    case 'paused':
      return { state: { ...state, status: 'running' }, events: [] };
    case 'finished':
      return unchanged(state);
  }
}

function advance(state: PlayerState, manual: boolean, events: PlayerEvent[]): PlayerState {
  if (state.index >= state.steps.length - 1) {
    events.push({ type: 'finished' });
    return { ...state, status: 'finished' };
  }
  const index = state.index + 1;
  const next: PlayerState = {
    ...state,
    index,
    elapsedInStepSec: 0,
    warned10s: false,
    lastCountdown: null,
  };
  events.push({ type: 'stepChanged', step: currentStep(next), index, manual });
  return next;
}

/**
 * Advances the clock by `dtSec`. Time left over at the end of a step carries into
 * the next one, so a long gap (e.g. a throttled background tab) is not lost.
 */
export function tick(state: PlayerState, dtSec: number): Transition {
  if (state.status !== 'running' || !(dtSec > 0)) return unchanged(state);

  const events: PlayerEvent[] = [];
  let s: PlayerState = { ...state, actualSecByStep: [...state.actualSecByStep] };
  let left = dtSec;

  while (s.status === 'running') {
    const step = currentStep(s);
    const used = Math.min(left, Math.max(0, step.durationSec - s.elapsedInStepSec));
    s.elapsedInStepSec += used;
    s.actualSecByStep[s.index] = (s.actualSecByStep[s.index] ?? 0) + used;
    left -= used;

    const remaining = step.durationSec - s.elapsedInStepSec;
    if (!s.warned10s && step.durationSec > WARN_MIN_STEP_SEC && remaining <= WARN_AT_SEC) {
      s.warned10s = true;
      events.push({ type: 'warn10s', next: nextStep(s) });
    }
    const wholeSec = Math.ceil(remaining);
    if (wholeSec >= 1 && wholeSec <= 3 && s.lastCountdown !== wholeSec) {
      s.lastCountdown = wholeSec;
      events.push({ type: 'countdown', remainingSec: wholeSec });
    }

    if (remaining > 0) break;
    s = { ...advance(s, false, events), actualSecByStep: s.actualSecByStep };
    if (left <= 0) break;
  }
  return { state: s, events };
}

/** Jumps to the next step (or finishes on the last one). Works while paused. */
export function skip(state: PlayerState): Transition {
  if (state.status === 'finished') return unchanged(state);
  const events: PlayerEvent[] = [];
  return { state: advance(state, true, events), events };
}

/** Lengthens the current step and re-arms its warnings. */
export function extendCurrent(state: PlayerState, sec = EXTEND_SEC): Transition {
  if (state.status === 'finished') return unchanged(state);
  const steps = state.steps.map((s, i) =>
    i === state.index ? { ...s, durationSec: s.durationSec + sec } : s,
  );
  return { state: { ...state, steps, warned10s: false, lastCountdown: null }, events: [] };
}

export function finish(state: PlayerState): Transition {
  if (state.status === 'finished') return unchanged(state);
  return { state: { ...state, status: 'finished' }, events: [{ type: 'finished' }] };
}

export interface PlayerProgress {
  totalSec: number;
  /** Planned time covered so far: finished steps plus elapsed part of the current one. */
  doneSec: number;
  remainingTotalSec: number;
  remainingInStepSec: number;
}

export function progress(state: PlayerState): PlayerProgress {
  const step = currentStep(state);
  const totalSec = totalDurationSec(state.steps);
  const doneSec =
    totalDurationSec(state.steps.slice(0, state.index)) +
    Math.min(state.elapsedInStepSec, step.durationSec);
  return {
    totalSec,
    doneSec,
    remainingTotalSec: Math.max(0, totalSec - doneSec),
    remainingInStepSec: Math.max(0, step.durationSec - state.elapsedInStepSec),
  };
}

/** Total time actually ridden. */
export function actualDurationSec(state: PlayerState): number {
  return state.actualSecByStep.reduce((sum, s) => sum + s, 0);
}

/** Records a hand-counted heart rate against the current step's target zone. */
export function addCount(state: PlayerState, valuePer10s: number, target: HrZone): PlayerState {
  const count: HrCount = {
    atSec: progress(state).doneSec,
    valuePer10s,
    targetZoneId: target.id,
    status: zoneStatus(valuePer10s, target),
  };
  return { ...state, counts: [...state.counts, count] };
}
