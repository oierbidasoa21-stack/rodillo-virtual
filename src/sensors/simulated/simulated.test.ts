import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CscReading, HrReading, SensorStatus } from '../types';
import { realClock } from './clock';
import { type SimCscControls, SimulatedCscSensor } from './simulatedCsc';
import { SimulatedHrSensor } from './simulatedHr';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});
afterEach(() => {
  vi.useRealTimers();
});

describe('SimulatedHrSensor', () => {
  it('connects, sends 1 Hz readings and settles near the target', async () => {
    const hr = new SimulatedHrSensor(
      () => ({ targetBpm: 150 }),
      realClock,
      () => 0.5,
    );
    const readings: HrReading[] = [];
    hr.onReading((r) => readings.push(r));
    await hr.connect();
    expect(hr.status).toBe('connected');
    expect(hr.deviceName).toBe('Pulsómetro simulado');

    vi.advanceTimersByTime(60_000);
    expect(readings).toHaveLength(60);
    expect(readings[0]).toMatchObject({ atMs: 1000, contact: true, rrMs: [] });
    // 75 → 150 with τ = 20 s: after 60 s, 75 + 75·(1 − e⁻³) ≈ 146.3
    expect(readings.at(-1)?.bpm).toBe(146);
  });

  it('stops sending while a dropped connection recovers', async () => {
    const hr = new SimulatedHrSensor(
      () => ({ targetBpm: 120 }),
      realClock,
      () => 0.5,
    );
    const statuses: SensorStatus[] = [];
    const readings: HrReading[] = [];
    hr.onStatus((s) => statuses.push(s));
    hr.onReading((r) => readings.push(r));
    await hr.connect();
    vi.advanceTimersByTime(3000);

    hr.simulateDrop(5000);
    vi.advanceTimersByTime(4900);
    expect(hr.status).toBe('reconnecting');
    expect(readings).toHaveLength(3);

    vi.advanceTimersByTime(1100);
    expect(hr.status).toBe('connected');
    expect(statuses).toEqual(['connecting', 'connected', 'reconnecting', 'connected']);
    expect(readings).toHaveLength(4);
  });

  it('stops on disconnect', async () => {
    const hr = new SimulatedHrSensor(
      () => ({ targetBpm: 120 }),
      realClock,
      () => 0.5,
    );
    const readings: HrReading[] = [];
    hr.onReading((r) => readings.push(r));
    await hr.connect();
    await hr.disconnect();
    vi.advanceTimersByTime(5000);
    expect(readings).toEqual([]);
    expect(hr.status).toBe('disconnected');
  });
});

describe('SimulatedCscSensor', () => {
  const controls: SimCscControls = {
    speedKmh: 30,
    cadenceRpm: 90,
    cadenceEnabled: true,
    wheelCircumferenceMm: 2155,
  };

  async function ride(c: SimCscControls, seconds: number) {
    const csc = new SimulatedCscSensor(() => c);
    const readings: CscReading[] = [];
    csc.onReading((r) => readings.push(r));
    await csc.connect();
    vi.advanceTimersByTime(seconds * 1000);
    return { csc, readings };
  }

  it('reaches the target speed and cadence through the real decoder', async () => {
    const { readings } = await ride(controls, 30);
    const last = readings.at(-1);
    expect(last?.speedKmh).toBeCloseTo(30, 0);
    expect(last?.cadenceRpm).toBeCloseTo(90, 0);
  });

  it('acts as a speed-only sensor when cadence is off', async () => {
    const { readings } = await ride({ ...controls, cadenceEnabled: false }, 10);
    expect(readings.at(-1)?.cadenceRpm).toBeNull();
    expect(readings.at(-1)?.speedKmh).toBeGreaterThan(20);
  });

  it('reports 0 km/h a few seconds after stopping', async () => {
    const c = { ...controls };
    const csc = new SimulatedCscSensor(() => c);
    const readings: CscReading[] = [];
    csc.onReading((r) => readings.push(r));
    await csc.connect();
    vi.advanceTimersByTime(20_000);
    c.speedKmh = 0;
    c.cadenceRpm = 0;
    vi.advanceTimersByTime(30_000);
    expect(readings.at(-1)).toMatchObject({ speedKmh: 0, cadenceRpm: 0 });
  });
});
