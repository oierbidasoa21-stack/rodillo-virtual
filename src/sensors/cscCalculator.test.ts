import { describe, expect, it } from 'vitest';
import { CscCalculator } from './cscCalculator';

const wheel = (revs: number, eventTime: number) => ({ wheel: { revs, eventTime }, crank: null });
const both = (w: number, wt: number, c: number, ct: number) => ({
  wheel: { revs: w, eventTime: wt },
  crank: { revs: c, eventTime: ct },
});

describe('CscCalculator', () => {
  it('needs two events before reporting a value', () => {
    const calc = new CscCalculator(2155);
    expect(calc.update(wheel(100, 0), 0)).toEqual({ speedKmh: null, cadenceRpm: null });
  });

  it('2 revs × 2.155 m in 1 s = 4.31 m/s = 15.516 km/h', () => {
    const calc = new CscCalculator(2155);
    calc.update(wheel(100, 0), 0);
    expect(calc.update(wheel(102, 1024), 1000).speedKmh).toBeCloseTo(15.516, 6);
  });

  it('handles the event time wrapping at 64 s', () => {
    // 64512 → 1024 is 2048 ticks = 2 s; 4 revs × 2.155 m / 2 s = 15.516 km/h
    const calc = new CscCalculator(2155);
    calc.update(wheel(100, 64512), 0);
    expect(calc.update(wheel(104, 1024), 2000).speedKmh).toBeCloseTo(15.516, 6);
  });

  it('handles the wheel counter wrapping at 2^32', () => {
    const calc = new CscCalculator(2155);
    calc.update(wheel(4294967295, 0), 0);
    expect(calc.update(wheel(1, 1024), 1000).speedKmh).toBeCloseTo(15.516, 6);
  });

  it('keeps the last speed briefly, then reports 0 after 3 s without revolutions', () => {
    const calc = new CscCalculator(2155);
    calc.update(wheel(100, 0), 0);
    calc.update(wheel(102, 1024), 1000);
    expect(calc.update(wheel(102, 1024), 3000).speedKmh).toBeCloseTo(15.516, 6);
    expect(calc.update(wheel(102, 1024), 4000).speedKmh).toBe(0);
    // Moving again
    expect(calc.update(wheel(104, 2048), 5000).speedKmh).toBeCloseTo(15.516, 6);
  });

  it('reports 0 for a bike that never moved since connecting', () => {
    const calc = new CscCalculator(2155);
    calc.update(wheel(100, 0), 0);
    expect(calc.update(wheel(100, 0), 1000).speedKmh).toBeNull();
    expect(calc.update(wheel(100, 0), 3000).speedKmh).toBe(0);
  });

  it('computes cadence: 3 crank revs in 2 s = 90 rpm', () => {
    const calc = new CscCalculator(2155);
    calc.update(both(0, 0, 10, 0), 0);
    expect(calc.update(both(0, 0, 13, 2048), 2000).cadenceRpm).toBeCloseTo(90, 9);
  });

  it('never invents cadence for a speed-only sensor', () => {
    const calc = new CscCalculator(2155);
    calc.update(wheel(100, 0), 0);
    expect(calc.update(wheel(102, 1024), 1000).cadenceRpm).toBeNull();
  });

  it('discards impossible jumps (sensor reset) and restarts from there', () => {
    const calc = new CscCalculator(2155);
    calc.update(wheel(100, 0), 0);
    calc.update(wheel(102, 1024), 1000);
    // Counter went backwards: modular delta is ~4e9 revs → discarded, last value kept
    expect(calc.update(wheel(5, 2048), 2000).speedKmh).toBeCloseTo(15.516, 6);
    // Next normal packet measures from the new baseline
    expect(calc.update(wheel(9, 4096), 4000).speedKmh).toBeCloseTo(15.516, 6);
  });

  it('applies a new wheel circumference to later values', () => {
    const calc = new CscCalculator(2155);
    calc.update(wheel(100, 0), 0);
    calc.setCircumference(2105);
    // 2 × 2.105 m / 1 s × 3.6 = 15.156 km/h
    expect(calc.update(wheel(102, 1024), 1000).speedKmh).toBeCloseTo(15.156, 6);
  });
});
