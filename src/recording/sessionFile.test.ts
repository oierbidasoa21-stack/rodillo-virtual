import { describe, expect, it } from 'vitest';
import type { SessionSummary } from '../domain/metrics/summary';
import { emptySecByZone } from '../domain/metrics/timeInZone';
import { EMPTY_READING, type RecordSample } from './recording';
import { isSimulatedSession, sessionFile } from './sessionFile';

const samples: RecordSample[] = [0, 1, 2].map((t) => ({
  ...EMPTY_READING,
  t,
  hr: 130,
  powerW: 180,
  lat: 43.1,
  lon: -2.1,
}));

function summary(over: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: 's',
    dateMs: 0,
    workoutName: 'Puerto',
    durationSec: 3,
    load: 1,
    kcalEstimated: 1,
    plannedSecByZone: emptySecByZone(),
    actualSecByZone: emptySecByZone(),
    counts: [],
    ...over,
  };
}

const ride = (routeId: string) => ({
  routeId,
  routeName: 'R',
  distanceM: 10,
  ascentM: 0,
  avgSpeedKmh: 30,
  mode: 'power' as const,
  laps: 0,
});

describe('session file for Strava', () => {
  it('keeps the position on an imported route', () => {
    const f = sessionFile(summary({ ride: ride('mi-gpx') }), { startMs: 0, samples });
    expect(f.content).toContain('<LatitudeDegrees>');
    expect(f.fileName).toMatch(/\.tcx$/);
  });

  it('leaves the position out on the made-up example routes', () => {
    const f = sessionFile(summary({ ride: ride('ej-puerto') }), { startMs: 0, samples });
    expect(f.content).not.toContain('<LatitudeDegrees>');
    expect(f.content).toContain('<ns3:Watts>180</ns3:Watts>');
  });

  it('says the power is estimated only when there is power', () => {
    const power = {
      avgW: 180,
      maxW: 180,
      npW: 180,
      ifactor: null,
      tss: null,
      kJ: 1,
      coveredSec: 60,
      secByPowerZone: null,
      estimated: true as const,
      simulated: false,
    };
    expect(sessionFile(summary({ power }), { startMs: 0, samples }).content).toContain(
      'Potencia estimada',
    );
    expect(sessionFile(summary(), { startMs: 0, samples }).content).not.toContain(
      'Potencia estimada',
    );
  });

  it('recognises a session with simulated readings', () => {
    expect(isSimulatedSession(summary())).toBe(false);
    const hrMeasured = {
      secByZone: emptySecByZone(),
      belowSec: 0,
      coveredSec: 60,
      avgBpm: 130,
      maxBpm: 140,
      simulated: true,
    };
    expect(isSimulatedSession(summary({ hrMeasured }))).toBe(true);
  });
});
