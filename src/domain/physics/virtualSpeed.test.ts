import { describe, expect, it } from 'vitest';
import { resistivePowerW, virtualSpeedMs } from './virtualSpeed';

// 80 kg rider + 10.6 kg bike
const MASS = 90.6;

describe('virtual speed', () => {
  it('hand case on the flat: 10 m/s needs 246.6 W', () => {
    // aero 0.5·1.225·0.32·10² = 19.6 N; rolling 0.005·90.6·9.81 = 4.444 N
    // (19.6 + 4.444) · 10 = 240.44 W at the wheel → / 0.975 = 246.6 W at the pedals
    expect(resistivePowerW(10, MASS, 0)).toBeCloseTo(240.44, 1);
    expect(virtualSpeedMs(246.6, MASS, 0)).toBeCloseTo(10, 2);
    expect(virtualSpeedMs(246.6, MASS, 0) * 3.6).toBeCloseTo(36, 1);
  });

  it('is 0 at 0 W on the flat or uphill', () => {
    expect(virtualSpeedMs(0, MASS, 0)).toBeCloseTo(0, 6);
    expect(virtualSpeedMs(0, MASS, 0.05)).toBeCloseTo(0, 6);
  });

  it('rolls downhill without pedalling', () => {
    expect(virtualSpeedMs(0, MASS, -0.05)).toBeGreaterThan(10);
  });

  it('is slower uphill and faster with more power', () => {
    expect(virtualSpeedMs(250, MASS, 0.06)).toBeLessThan(virtualSpeedMs(250, MASS, 0));
    expect(virtualSpeedMs(300, MASS, 0)).toBeGreaterThan(virtualSpeedMs(200, MASS, 0));
  });

  it('balances the equation it solves', () => {
    for (const [p, grade] of [
      [150, 0.03],
      [400, -0.02],
      [220, 0.08],
    ] as const) {
      const v = virtualSpeedMs(p, MASS, grade);
      expect(resistivePowerW(v, MASS, grade)).toBeCloseTo(p * 0.975, 3);
    }
  });
});
