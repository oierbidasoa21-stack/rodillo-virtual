import { virtualSpeedMs } from '../physics/virtualSpeed';
import { positionAt } from './position';
import type { Route } from './route';

/**
 * Where the speed on the route comes from:
 * - `power`: physics. Estimated power, slope and mass give a virtual speed.
 * - `wheel`: no trainer curve, so no power. The real wheel speed moves you along
 *   and the slope is only shown. Must be labelled as such in the UI.
 */
export type RideMode = 'power' | 'wheel';

export interface RideState {
  /** Total distance ridden, across laps. */
  distanceM: number;
  speedMs: number;
  ascentM: number;
  elapsedSec: number;
  /** Reached the end of a non-looping route. */
  finished: boolean;
}

export type RideInput =
  | { mode: 'power'; powerW: number | null; massKg: number }
  | { mode: 'wheel'; wheelSpeedKmh: number | null };

/** Bike + rider don't change speed instantly: seconds to close ~63 % of the gap. */
export const SPEED_TAU_SEC = 4;
/** Long ticks (a throttled tab) are integrated in steps no longer than this. */
const MAX_STEP_SEC = 1;

export function startRide(): RideState {
  return { distanceM: 0, speedMs: 0, ascentM: 0, elapsedSec: 0, finished: false };
}

/** Steady speed the rider is heading for, in m/s. No reading counts as not pedalling / stopped. */
function targetSpeedMs(input: RideInput, grade: number): number {
  if (input.mode === 'wheel') return Math.max(0, input.wheelSpeedKmh ?? 0) / 3.6;
  return virtualSpeedMs(input.powerW ?? 0, input.massKg, grade);
}

/**
 * Moves the rider `dtSec` along the route. In power mode speed eases towards the
 * physics speed for the current slope; in wheel mode it is the wheel speed.
 */
export function advanceRide(
  state: RideState,
  route: Route,
  dtSec: number,
  input: RideInput,
  loop = false,
): RideState {
  if (state.finished || !(dtSec > 0)) return state;
  let s = { ...state };
  let left = dtSec;
  while (left > 0 && !s.finished) {
    const dt = Math.min(MAX_STEP_SEC, left);
    left -= dt;
    const here = positionAt(route, s.distanceM, loop);
    const target = targetSpeedMs(input, here.grade);
    const speedMs =
      input.mode === 'wheel'
        ? target
        : s.speedMs + (target - s.speedMs) * (1 - Math.exp(-dt / SPEED_TAU_SEC));

    let distanceM = s.distanceM + speedMs * dt;
    let finished = false;
    if (!loop && distanceM >= route.distanceM) {
      distanceM = route.distanceM;
      finished = true;
    }
    const there = positionAt(route, distanceM, loop);
    // Climbing within a lap; crossing a lap boundary jumps back to the start, which isn't a climb.
    const climbed = there.lap === here.lap ? Math.max(0, there.ele - here.ele) : 0;
    s = {
      distanceM,
      speedMs,
      ascentM: s.ascentM + climbed,
      elapsedSec: s.elapsedSec + dt,
      finished,
    };
  }
  return s;
}
