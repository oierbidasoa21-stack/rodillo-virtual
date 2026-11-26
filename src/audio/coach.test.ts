import { describe, expect, it } from 'vitest';
import { buildRoute } from '../domain/route/route';
import { findClimbs } from '../domain/route/climbs';
import type { ZoneStatus } from '../domain/zones/zones';
import { type CoachState, climbCues, coachTick, finishSummary, startCoach } from './coach';

/** Runs the coach second by second over one block, collecting what it says. */
function ride(
  seconds: number,
  hr: (t: number) => ZoneStatus | null,
  opts: { durationSec?: number; kind?: 'work' | 'rec'; state?: CoachState } = {},
) {
  let state = opts.state ?? startCoach();
  const said: { t: number; text: string }[] = [];
  for (let t = 0; t < seconds; t++) {
    const r = coachTick(state, {
      nowSec: t,
      stepIndex: 0,
      stepKind: opts.kind ?? 'work',
      elapsedInStepSec: t,
      stepDurationSec: opts.durationSec ?? 600,
      hrStatus: hr(t),
    });
    state = r.state;
    for (const text of r.say) said.push({ t, text });
  }
  return said;
}

describe('coach', () => {
  it('says halfway and last minute on long blocks only', () => {
    const long = ride(600, () => null).map((x) => x.text);
    expect(long).toEqual(['Mitad del bloque', 'Último minuto']);
    expect(ride(180, () => null, { durationSec: 180 })).toEqual([]);
  });

  it('waits for the heart rate to settle and to stay out before a cue', () => {
    // Above the zone from the start: settles 60 s, then 25 s out → first cue at 85 s.
    const said = ride(200, () => 'above', { durationSec: 200 });
    expect(said[0]).toEqual({ t: 85, text: 'Pulso por encima de la zona, afloja un poco' });
    // The next one waits 90 s.
    expect(said[1]?.t).toBe(175);
  });

  it('does not nag about a short excursion and praises getting back in', () => {
    expect(ride(200, (t) => (t > 100 && t < 115 ? 'above' : 'in'), { durationSec: 200 })).toEqual(
      [],
    );
    const said = ride(200, (t) => (t < 100 ? 'below' : 'in'), { durationSec: 200 });
    expect(said.map((x) => x.text)).toEqual([
      'Pulso por debajo de la zona, aprieta un poco',
      'Pulso en zona, así',
    ]);
    expect(said[1]?.t).toBe(110);
  });

  it('does not ask to push harder in a recovery block', () => {
    expect(ride(200, () => 'below', { kind: 'rec', durationSec: 200 })).toEqual([]);
    expect(ride(200, () => 'above', { kind: 'rec', durationSec: 200 })[0]?.text).toBe(
      'Pulso alto: suelta y deja que baje',
    );
  });

  it('says a summary at the end with what was measured', () => {
    expect(finishSummary({ durationSec: 2700, load: 120.4, avgBpm: 142, distanceM: null })).toBe(
      'Sesión terminada: 45 minutos, carga 120, pulso medio 142. Buen trabajo.',
    );
    expect(finishSummary({ durationSec: 1800, load: null, avgBpm: null, distanceM: 12_340 })).toBe(
      'Sesión terminada: 30 minutos, 12,3 kilómetros. Buen trabajo.',
    );
  });
});

describe('climbs', () => {
  // 1 km flat, 1.5 km at 6 %, 1 km flat, due north.
  const pts = Array.from({ length: 36 }, (_, i) => {
    const d = i * 100;
    const ele = d <= 1000 ? 100 : d <= 2500 ? 100 + (d - 1000) * 0.06 : 190;
    return { lat: 43 + d / 111_195, lon: -2, ele };
  });
  const route = buildRoute(pts, { id: 'c', name: 'C', source: 'builtin' });
  if (!route) throw new Error('route');

  it('finds the climb with its length and grade', () => {
    const climbs = findClimbs(route);
    expect(climbs).toHaveLength(1);
    const [c] = climbs;
    expect(c?.startM).toBeGreaterThan(900);
    expect(c?.startM).toBeLessThan(1050);
    expect(c?.endM).toBeGreaterThan(2450);
    expect(c?.endM).toBeLessThan(2550);
    expect(c?.avgGrade).toBeCloseTo(0.06, 2);
  });

  it('announces it before, near the top and at the top', () => {
    const climbs = [{ startM: 1000, endM: 2500, gainM: 90, avgGrade: 0.06 }];
    expect(climbCues(climbs, 690, 710)).toEqual([
      'Subida en 300 metros: 1,5 kilómetros al 6 por ciento',
    ]);
    expect(climbCues(climbs, 1990, 2005)).toEqual(['Quinientos metros para la cima']);
    expect(climbCues(climbs, 2499, 2501)).toEqual(['Cima']);
    expect(climbCues(climbs, 1200, 1300)).toEqual([]);
  });
});
