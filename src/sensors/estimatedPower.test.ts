import { describe, expect, it } from 'vitest';
import { customCurve } from '../domain/trainer/curves';
import { estimatePowerW } from './estimatedPower';

const curve = customCurve(2, 0.01);
const at = (speedKmh: number | null, atMs = 1000) => ({ atMs, speedKmh, cadenceRpm: null });

describe('estimatePowerW', () => {
  it('applies the curve to a fresh speed: 30 km/h → 60 + 270 = 330 W', () => {
    expect(estimatePowerW(at(30), curve, 2000)).toBeCloseTo(330, 9);
  });

  it('gives nothing without a curve, a fresh reading or a speed', () => {
    expect(estimatePowerW(at(30), null, 2000)).toBeNull();
    expect(estimatePowerW(at(30, 1000), curve, 7000)).toBeNull();
    expect(estimatePowerW(at(null), curve, 2000)).toBeNull();
    expect(estimatePowerW(null, curve, 2000)).toBeNull();
  });
});
