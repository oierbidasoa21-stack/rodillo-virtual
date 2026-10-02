import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TRAINER_CHOICE,
  TRAINER_CURVES,
  curveFor,
  customCurve,
  findTrainerCurve,
  speedForPowerKmh,
  trainerPowerW,
} from './curves';

const roadMachine = findTrainerCurve('kurt-road-machine');
if (!roadMachine) throw new Error('missing curve');

describe('trainerPowerW', () => {
  it('Kurt Road Machine at 20 mph: 5.24482·20 + 0.019168·20³ = 104.9 + 153.3 = 258.2 W', () => {
    const kmh = 20 * 1.609344;
    expect(trainerPowerW(roadMachine, kmh)).toBeCloseTo(258.24, 1);
  });

  it('custom curve in km/h: a=2, b=0.01 at 30 km/h → 60 + 270 = 330 W', () => {
    expect(trainerPowerW(customCurve(2, 0.01), 30)).toBeCloseTo(330, 9);
  });

  it('is 0 when stopped and never negative', () => {
    expect(trainerPowerW(roadMachine, 0)).toBe(0);
    expect(trainerPowerW(roadMachine, -5)).toBe(0);
    expect(trainerPowerW(customCurve(-10, 0), 10)).toBe(0);
  });

  it('every listed curve has a source and rises with speed', () => {
    for (const curve of TRAINER_CURVES) {
      expect(curve.source.length).toBeGreaterThan(10);
      const powers = [10, 20, 30, 40, 50].map((v) => trainerPowerW(curve, v));
      expect(powers).toEqual([...powers].sort((a, b) => a - b));
      // Plausible: 50–700 W at 30 km/h
      expect(trainerPowerW(curve, 30)).toBeGreaterThan(50);
      expect(trainerPowerW(curve, 30)).toBeLessThan(700);
    }
  });
});

describe('speedForPowerKmh', () => {
  it('inverts the curve', () => {
    const kmh = speedForPowerKmh(roadMachine, 258.24);
    expect(kmh).toBeCloseTo(20 * 1.609344, 1);
    for (const curve of TRAINER_CURVES) {
      const v = speedForPowerKmh(curve, 200);
      expect(v).not.toBeNull();
      expect(trainerPowerW(curve, v ?? 0)).toBeCloseTo(200, 6);
    }
  });

  it('handles zero and unreachable targets', () => {
    expect(speedForPowerKmh(roadMachine, 0)).toBe(0);
    expect(speedForPowerKmh(customCurve(1, 0), 5000)).toBeNull();
  });
});

describe('curveFor', () => {
  it('maps a settings choice to a curve, or none', () => {
    expect(curveFor({ ...DEFAULT_TRAINER_CHOICE })).toBeNull();
    expect(curveFor({ ...DEFAULT_TRAINER_CHOICE, modelId: 'kurt-cyclone' })?.name).toBe(
      'Kurt Kinetic Cyclone',
    );
    expect(curveFor({ modelId: 'custom', customA: 2, customB: 0.01 })?.coefficients).toEqual([
      0, 2, 0, 0.01,
    ]);
    expect(curveFor({ ...DEFAULT_TRAINER_CHOICE, modelId: 'gone' })).toBeNull();
  });

  it('the custom default is the Road Machine in km/h (within 0.5 %)', () => {
    const custom = curveFor({ ...DEFAULT_TRAINER_CHOICE, modelId: 'custom' });
    if (!custom) throw new Error('missing');
    const ratio = trainerPowerW(custom, 32) / trainerPowerW(roadMachine, 32);
    expect(Math.abs(ratio - 1)).toBeLessThan(0.005);
  });
});
