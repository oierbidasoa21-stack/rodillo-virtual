import { describe, expect, it } from 'vitest';
import { builtinRoutes } from '../domain/route/examples';
import { advanceRide, startRide } from '../domain/route/ride';
import { expandWorkout } from '../domain/workout/expand';
import { createPlayer, tick, togglePlay } from '../domain/workout/player';
import { makeBlock } from '../domain/workout/types';
import type { HrZone } from '../domain/zones/zones';
import { recorderTick, startRecorder } from './recorder';
import {
  type SessionSnapshot,
  recordingOf,
  snapshotElapsedSec,
  snapshotName,
  summaryFromSnapshot,
} from './session';

const ZONES: HrZone[] = [
  { id: 'L1', label: 'L1', min: 20, max: 21 },
  { id: 'L2', label: 'L2', min: 22, max: 23 },
  { id: 'L3', label: 'L3', min: 24, max: 25 },
  { id: 'UA', label: 'UA', min: 26, max: 27 },
  { id: 'UA+', label: 'UA+', min: 28, max: 28 },
  { id: 'VO2', label: 'VO2', min: 29, max: null },
];
const workout = { id: 'w', name: 'Fondo corto', description: '', blocks: [makeBlock(600, 'L2')] };

function halfWorkout(): SessionSnapshot {
  const player = tick(togglePlay(createPlayer(expandWorkout(workout.blocks))).state, 300).state;
  let recorder = startRecorder(1_700_000_000_000);
  for (let i = 0; i < 300; i++) {
    recorder = recorderTick(
      recorder,
      1,
      {
        bpm: 132,
        bpmSimulated: true,
        watts: 180,
        wattsSimulated: true,
        wheelSpeedKmh: 30,
        cadenceRpm: 88,
        route: null,
      },
      ZONES,
    );
  }
  return {
    kind: 'workout',
    savedAtMs: 1,
    workout,
    playMode: 'normal',
    player,
    route: null,
    ride: startRide(),
    recorder,
  };
}

describe('session snapshot', () => {
  it('names and times a half-done workout', () => {
    const s = halfWorkout();
    expect(snapshotName(s)).toBe('Fondo corto');
    expect(snapshotElapsedSec(s)).toBe(300);
  });

  it('turns it into the same summary the player would build: 5′ in L2 = load 10, power, simulated', () => {
    const summary = summaryFromSnapshot(halfWorkout(), {
      id: 'x',
      dateMs: 2,
      weightKg: 70,
      ftpW: 200,
    });
    expect(summary.workoutName).toBe('Fondo corto');
    expect(summary.durationSec).toBe(300);
    expect(summary.hrMeasured?.simulated).toBe(true);
    expect(summary.load).toBeCloseTo(10, 6);
    expect(summary.power?.avgW).toBe(180);
    expect(summary.kcalEstimated).toBeCloseTo(54, 6); // 180 W · 300 s = 54 kJ
  });

  it('turns a half-done free ride into a ride summary', () => {
    const route = builtinRoutes()[0];
    if (!route) throw new Error('route');
    const ride = advanceRide({ ...startRide(), speedMs: 10 }, route, 100, {
      mode: 'wheel',
      wheelSpeedKmh: 36,
    });
    const snap: SessionSnapshot = {
      kind: 'ride',
      savedAtMs: 1,
      route,
      mode: 'wheel',
      ride,
      recorder: startRecorder(0),
    };
    const summary = summaryFromSnapshot(snap, { id: 'r', dateMs: 2, weightKg: 70, ftpW: null });
    expect(summary.ride).toMatchObject({ routeId: route.id, mode: 'wheel' });
    expect(summary.ride?.distanceM).toBeCloseTo(1000, 0);
  });

  it('keeps the samples for the history entry', () => {
    const s = halfWorkout();
    const rec = recordingOf('x', s.recorder);
    expect(rec).toMatchObject({ sessionId: 'x', startMs: 1_700_000_000_000 });
    expect(rec.samples).toHaveLength(300);
  });
});
