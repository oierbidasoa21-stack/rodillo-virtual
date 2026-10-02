import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { encodeCsc } from '../parse/csc';
import { realClock } from '../simulated/clock';
import type { CscReading, HrReading, SensorStatus } from '../types';
import { BLE_MESSAGES } from './bleSensor';
import { CscSensor } from './cscSensor';
import { HeartRateSensor } from './heartRateSensor';

/** Minimal stand-ins for the Web Bluetooth objects the sensor touches. */
class FakeCharacteristic extends EventTarget {
  value: DataView | undefined;
  startNotifications = vi.fn(async () => this);
  stopNotifications = vi.fn(async () => this);
  notify(view: DataView) {
    this.value = view;
    this.dispatchEvent(new Event('characteristicvaluechanged'));
  }
}

class FakeDevice extends EventTarget {
  name = 'Banda de prueba';
  char = new FakeCharacteristic();
  /** Make the next N gatt.connect() calls fail. */
  failNext = 0;
  gatt = {
    connected: false,
    connect: vi.fn(async () => {
      if (this.failNext > 0) {
        this.failNext -= 1;
        throw new DOMException('out of range', 'NetworkError');
      }
      this.gatt.connected = true;
      return {
        getPrimaryService: async () => ({ getCharacteristic: async () => this.char }),
      };
    }),
    disconnect: vi.fn(() => this.drop()),
  };
  /** The link goes away (out of range, battery, or a manual disconnect). */
  drop() {
    this.gatt.connected = false;
    this.dispatchEvent(new Event('gattserverdisconnected'));
  }
}

function setup(device = new FakeDevice()) {
  const bluetooth = {
    getAvailability: vi.fn(async () => true),
    requestDevice: vi.fn(async () => device),
  } as unknown as Bluetooth;
  const deps = { bluetooth, clock: realClock };
  const hr = new HeartRateSensor(deps);
  const statuses: SensorStatus[] = [];
  const readings: HrReading[] = [];
  hr.onStatus((s) => statuses.push(s));
  hr.onReading((r) => readings.push(r));
  return { device, bluetooth, hr, statuses, readings };
}

const flush = () => vi.advanceTimersByTimeAsync(0);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(10_000);
});
afterEach(() => {
  vi.useRealTimers();
});

describe('BleSensor (heart rate)', () => {
  it('connects, subscribes and decodes notifications', async () => {
    const { device, bluetooth, hr, statuses, readings } = setup();
    await hr.connect();

    expect(bluetooth.requestDevice).toHaveBeenCalledWith({
      filters: [{ services: ['heart_rate'] }],
    });
    expect(statuses).toEqual(['connecting', 'connected']);
    expect(hr.deviceName).toBe('Banda de prueba');
    expect(device.char.startNotifications).toHaveBeenCalled();

    device.char.notify(new DataView(new Uint8Array([0x06, 142]).buffer));
    expect(readings).toEqual([{ atMs: 10_000, bpm: 142, contact: true, rrMs: [] }]);
  });

  it('retries after 1, 2 and 4 s when the link drops, then reconnects', async () => {
    const { device, hr, statuses } = setup();
    await hr.connect();
    device.failNext = 2;
    device.drop();
    expect(hr.status).toBe('reconnecting');

    await vi.advanceTimersByTimeAsync(999);
    expect(device.gatt.connect).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1); // 1 s: fails
    expect(device.gatt.connect).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2000); // +2 s: fails
    expect(device.gatt.connect).toHaveBeenCalledTimes(3);
    expect(hr.status).toBe('reconnecting');
    await vi.advanceTimersByTimeAsync(4000); // +4 s: works
    expect(device.gatt.connect).toHaveBeenCalledTimes(4);
    expect(hr.status).toBe('connected');
    expect(statuses).toEqual(['connecting', 'connected', 'reconnecting', 'connected']);
  });

  it('caps the wait at 30 s and keeps trying', async () => {
    const { device, hr } = setup();
    await hr.connect();
    device.failNext = 100;
    device.drop();
    // 1+2+4+8+16+30 = 61 s for six attempts, then every 30 s
    await vi.advanceTimersByTimeAsync(61_000);
    expect(device.gatt.connect).toHaveBeenCalledTimes(7);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(device.gatt.connect).toHaveBeenCalledTimes(8);
    expect(hr.status).toBe('reconnecting');
  });

  it('does not reconnect after a manual disconnect', async () => {
    const { device, hr } = setup();
    await hr.connect();
    await hr.disconnect();
    expect(hr.status).toBe('disconnected');
    expect(hr.deviceName).toBeNull();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(device.gatt.connect).toHaveBeenCalledTimes(1);
  });

  it('stops retrying when the user disconnects while reconnecting', async () => {
    const { device, hr } = setup();
    await hr.connect();
    device.failNext = 100;
    device.drop();
    await vi.advanceTimersByTimeAsync(1000);
    await hr.disconnect();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(device.gatt.connect).toHaveBeenCalledTimes(2);
    expect(hr.status).toBe('disconnected');
  });

  it('reports a cancelled chooser without an error state', async () => {
    const { bluetooth, hr } = setup();
    vi.mocked(bluetooth.requestDevice).mockRejectedValueOnce(
      new DOMException('User cancelled', 'NotFoundError'),
    );
    await hr.connect();
    expect(hr.status).toBe('disconnected');
    expect(hr.error).toBe(BLE_MESSAGES.cancelled);
  });

  it('explains missing or switched-off Bluetooth', async () => {
    const noBt = new HeartRateSensor({ bluetooth: undefined, clock: realClock });
    await noBt.connect();
    expect([noBt.status, noBt.error]).toEqual(['error', BLE_MESSAGES.unsupported]);

    const { bluetooth, hr } = setup();
    vi.mocked(bluetooth.getAvailability).mockResolvedValueOnce(false);
    await hr.connect();
    expect([hr.status, hr.error]).toEqual(['error', BLE_MESSAGES.unavailable]);
  });

  it('reports a failed connection', async () => {
    const device = new FakeDevice();
    device.failNext = 1;
    const { hr } = setup(device);
    await hr.connect();
    expect([hr.status, hr.error]).toEqual(['error', BLE_MESSAGES.failed]);
  });
});

describe('CscSensor', () => {
  it('turns notifications into speed with the configured wheel', async () => {
    const device = new FakeDevice();
    const bluetooth = { requestDevice: async () => device } as unknown as Bluetooth;
    let wheel = 2155;
    const csc = new CscSensor(() => wheel, { bluetooth, clock: realClock });
    const readings: CscReading[] = [];
    csc.onReading((r) => readings.push(r));
    await csc.connect();

    device.char.notify(encodeCsc({ wheel: { revs: 100, eventTime: 0 }, crank: null }));
    await vi.advanceTimersByTimeAsync(1000);
    device.char.notify(encodeCsc({ wheel: { revs: 102, eventTime: 1024 }, crank: null }));
    expect(readings[1]?.speedKmh).toBeCloseTo(15.516, 6);
    expect(readings[1]?.cadenceRpm).toBeNull();

    wheel = 2105;
    await vi.advanceTimersByTimeAsync(1000);
    device.char.notify(encodeCsc({ wheel: { revs: 104, eventTime: 2048 }, crank: null }));
    expect(readings[2]?.speedKmh).toBeCloseTo(15.156, 6);
  });

  it('starts a fresh baseline after reconnecting', async () => {
    const device = new FakeDevice();
    const bluetooth = { requestDevice: async () => device } as unknown as Bluetooth;
    const csc = new CscSensor(() => 2155, { bluetooth, clock: realClock });
    const readings: CscReading[] = [];
    csc.onReading((r) => readings.push(r));
    await csc.connect();
    device.char.notify(encodeCsc({ wheel: { revs: 100, eventTime: 0 }, crank: null }));
    device.drop();
    await vi.advanceTimersByTimeAsync(1000);
    await flush();
    expect(csc.status).toBe('connected');
    // 50 revs later after the gap: no bogus average over the outage
    device.char.notify(encodeCsc({ wheel: { revs: 150, eventTime: 30000 }, crank: null }));
    expect(readings.at(-1)?.speedKmh).toBeNull();
  });
});
