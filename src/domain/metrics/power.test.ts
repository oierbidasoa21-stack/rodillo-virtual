import { describe, expect, it } from 'vitest';
import {
  averagePowerW,
  bestAverageW,
  emptyPowerSampler,
  intensityFactor,
  kilojoules,
  maxPowerW,
  normalizedPowerW,
  samplePower,
  trainingStressScore,
} from './power';

const constant = (watts: number, sec: number) => Array.from({ length: sec }, () => watts);

describe('power metrics', () => {
  it('1 h at a steady 200 W with FTP 200: NP 200, IF 1, TSS 100, 720 kJ', () => {
    const hour = constant(200, 3600);
    const np = normalizedPowerW(hour) ?? NaN;
    expect(np).toBeCloseTo(200, 9);
    expect(intensityFactor(np, 200)).toBeCloseTo(1, 9);
    expect(trainingStressScore(3600, np, 200)).toBeCloseTo(100, 9);
    expect(kilojoules(hour)).toBeCloseTo(720, 9);
    expect(averagePowerW(hour)).toBe(200);
  });

  it('NP weights hard efforts: 10′ blocks of 300 and 100 W → ≈ ((300⁴+100⁴)/2)^¼ = 253 W', () => {
    const samples = [0, 1, 2, 3, 4, 5].flatMap((i) => constant(i % 2 ? 100 : 300, 600));
    expect(averagePowerW(samples)).toBe(200);
    expect(Math.abs((normalizedPowerW(samples) ?? 0) - 253)).toBeLessThan(2);
  });

  it('TSS for 30′ at NP 250 with FTP 250: (1800·250·1)/(250·3600)·100 = 50', () => {
    expect(trainingStressScore(1800, 250, 250)).toBeCloseTo(50, 9);
  });

  it('needs 30 s for NP', () => {
    expect(normalizedPowerW(constant(200, 29))).toBeNull();
    expect(normalizedPowerW(constant(200, 30))).toBeCloseTo(200, 9);
  });

  it('finds the best minute', () => {
    // 2′ at 200 W, 1′ at 320 W, 1′ at 150 W → best 60 s = 320
    const samples = [...constant(200, 120), ...constant(320, 60), ...constant(150, 60)];
    expect(bestAverageW(samples, 60)).toBeCloseTo(320, 9);
    expect(maxPowerW(samples)).toBe(320);
    expect(bestAverageW(constant(300, 59), 60)).toBeNull();
  });

  it('handles no samples', () => {
    expect(averagePowerW([])).toBeNull();
    expect(maxPowerW([])).toBeNull();
    expect(kilojoules([])).toBe(0);
  });
});

describe('samplePower', () => {
  it('takes one sample per whole second from 200 ms ticks', () => {
    let s = emptyPowerSampler();
    for (let i = 0; i < 25; i++) s = samplePower(s, 0.2, 180); // 5 s
    expect(s.samples).toEqual([180, 180, 180, 180, 180]);
    expect(s.carrySec).toBeCloseTo(0, 9);
  });

  it('skips seconds without a reading and handles long gaps', () => {
    let s = emptyPowerSampler();
    s = samplePower(s, 2.5, null);
    s = samplePower(s, 0.5, 200); // crosses the 3rd second
    s = samplePower(s, 3, 250);
    expect(s.samples).toEqual([200, 250, 250, 250]);
  });
});
