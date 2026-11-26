import { describe, expect, it } from 'vitest';
import type { SessionSummary } from '../domain/metrics/summary';
import {
  bestRideOn,
  gapToGhostSec,
  ghostDistanceAt,
  ghostFrom,
  ghostSpeedAt,
  ghostTimeAt,
} from './ghost';
import type { RecordSample } from './recording';

const sample = (t: number, distanceM: number | null): RecordSample => ({
  t,
  distanceM,
  hr: null,
  powerW: null,
  speedKmh: null,
  cadenceRpm: null,
  altitudeM: null,
  lat: null,
  lon: null,
});

// 10 m/s for 200 s (2 km), with a missing reading and a backwards glitch.
const samples = Array.from({ length: 201 }, (_, t) =>
  sample(t, t === 50 ? null : t === 120 ? 1190 - 30 : t * 10),
);

describe('ghost', () => {
  const g = ghostFrom('s1', 0, samples);

  it('replays the recorded ride, never backwards', () => {
    expect(g).not.toBeNull();
    if (!g) return;
    expect(ghostDistanceAt(g, 0)).toBe(0);
    expect(ghostDistanceAt(g, 50)).toBeCloseTo(500, 6); // interpolated over the gap
    expect(ghostDistanceAt(g, 120)).toBe(1190); // glitch held at the previous distance
    expect(ghostDistanceAt(g, 999)).toBe(2000); // stops where it ended
    expect(ghostSpeedAt(g, 100)).toBeCloseTo(10, 6);
  });

  it('knows when it reached a distance and the gap to it', () => {
    if (!g) return;
    expect(ghostTimeAt(g, 1500)).toBeCloseTo(150, 6);
    expect(ghostTimeAt(g, 2500)).toBeNull();
    // At 1500 m after 160 s: 10 s behind. After 140 s: 10 s ahead.
    expect(gapToGhostSec(g, 1500, 160)).toBeCloseTo(10, 6);
    expect(gapToGhostSec(g, 1500, 140)).toBeCloseTo(-10, 6);
  });

  it('needs some distance to race', () => {
    expect(ghostFrom('x', 0, [sample(0, 0), sample(1, 5)])).toBeNull();
    expect(ghostFrom('x', 0, [sample(0, null), sample(1, null)])).toBeNull();
  });
});

describe('best ride', () => {
  const ride = (id: string, routeId: string, km: number, kmh: number, simulated = false) =>
    ({
      id,
      ride: {
        routeId,
        routeName: 'R',
        distanceM: km * 1000,
        ascentM: 0,
        avgSpeedKmh: kmh,
        mode: 'wheel',
        laps: 0,
      },
      ...(simulated ? { hrMeasured: { simulated: true } } : {}),
    }) as unknown as SessionSummary;

  it('picks the fastest real ride of at least 1 km on that route', () => {
    const sessions = [
      ride('a', 'r1', 10, 25),
      ride('b', 'r1', 12, 28),
      ride('c', 'r1', 0.5, 40), // too short
      ride('d', 'r1', 12, 35, true), // simulated
      ride('e', 'r2', 12, 30), // another route
    ];
    expect(bestRideOn(sessions, 'r1')?.id).toBe('b');
    expect(bestRideOn(sessions, 'r3')).toBeNull();
  });
});
