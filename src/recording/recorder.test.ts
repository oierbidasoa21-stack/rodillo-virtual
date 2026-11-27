import { describe, expect, it } from 'vitest';
import type { HrZone } from '../domain/zones/zones';
import {
  type RecorderInput,
  type RecorderState,
  recorderTick,
  routeInputOf,
  startRecorder,
} from './recorder';
import { builtinRoutes } from '../domain/route/examples';
import { positionAt } from '../domain/route/position';
import { startRide } from '../domain/route/ride';

const ZONES: HrZone[] = [
  { id: 'Z1', label: 'Z1', min: 20, max: 21 },
  { id: 'Z2', label: 'Z2', min: 22, max: 23 },
  { id: 'Z3', label: 'Z3', min: 24, max: 25 },
  { id: 'Z4', label: 'Z4', min: 26, max: 27 },
  { id: 'Z5', label: 'Z5', min: 28, max: 28 },
  { id: 'Z6', label: 'Z6', min: 29, max: null },
];

const NONE: RecorderInput = {
  bpm: null,
  bpmSimulated: false,
  watts: null,
  wattsSimulated: false,
  wheelSpeedKmh: null,
  cadenceRpm: null,
  route: null,
};

function run(state: RecorderState, seconds: number, input: RecorderInput) {
  let s = state;
  for (let i = 0; i < Math.round(seconds / 0.2); i++) s = recorderTick(s, 0.2, input, ZONES);
  return s;
}

describe('recorderTick', () => {
  it('without a route: wheel distance from the real speed, 36 km/h for 10 s = 100 m', () => {
    const s = run(startRecorder(0), 10, { ...NONE, wheelSpeedKmh: 36, cadenceRpm: 90, bpm: 132 });
    expect(s.wheelDistanceM).toBeCloseTo(100, 6);
    expect(s.recording.samples).toHaveLength(10);
    const last = s.recording.samples.at(-1);
    expect(last).toMatchObject({ t: 10, speedKmh: 36, cadenceRpm: 90, hr: 132, altitudeM: null });
    expect(last?.distanceM).toBeCloseTo(100, 6);
    expect(s.hrTime.secByZone.Z2).toBeCloseTo(10, 6); // 132 / 6 = 22 → Z2
  });

  it('records no distance at all without a speed sensor (nothing is made up)', () => {
    const s = run(startRecorder(0), 3, { ...NONE, bpm: 120 });
    expect(s.recording.samples.every((x) => x.distanceM === null && x.speedKmh === null)).toBe(
      true,
    );
  });

  it('on a route, uses the route distance, speed, altitude and position', () => {
    const route = { distanceM: 1234, speedKmh: 28, altitudeM: 456, lat: 1, lon: 2 };
    const s = run(startRecorder(0), 1, { ...NONE, wheelSpeedKmh: 30, route, watts: 220 });
    expect(s.recording.samples[0]).toEqual({
      t: 1,
      hr: null,
      powerW: 220,
      speedKmh: 28,
      cadenceRpm: null,
      distanceM: 1234,
      altitudeM: 456,
      lat: 1,
      lon: 2,
    });
    expect(s.power.samples).toEqual([220]);
  });

  it('remembers whether any data was simulated', () => {
    let s = run(startRecorder(0), 1, { ...NONE, bpm: 120, bpmSimulated: true });
    s = run(s, 1, { ...NONE, watts: 100, wattsSimulated: false });
    expect([s.hrSimulated, s.powerSimulated]).toEqual([true, false]);
  });

  it('survives a JSON round trip (saved and resumed)', () => {
    const s = run(startRecorder(5), 2, { ...NONE, bpm: 150, wheelSpeedKmh: 30 });
    const back = JSON.parse(JSON.stringify(s)) as RecorderState;
    const next = run(back, 1, { ...NONE, bpm: 150, wheelSpeedKmh: 30 });
    expect(next.recording.samples.map((x) => x.t)).toEqual([1, 2, 3]);
    expect(next.hrTime.coveredSec).toBeCloseTo(3, 6);
  });
});

describe('routeInputOf', () => {
  it('takes distance and speed from the ride and height and position from the route, looping', () => {
    const route = builtinRoutes()[0];
    if (!route) throw new Error('route');
    const ride = { ...startRide(), distanceM: route.distanceM + 5, speedMs: 10 };
    const r = routeInputOf(route, ride, true);
    const start = positionAt(route, 5);
    expect(r.distanceM).toBe(route.distanceM + 5);
    expect(r.speedKmh).toBeCloseTo(36, 6);
    expect(r.altitudeM).toBeCloseTo(start.ele, 6);
    expect([r.lat, r.lon]).toEqual([start.lat, start.lon]);
  });
});
