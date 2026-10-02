import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSensorsStore } from '../store/sensorsStore';
import { useSettingsStore } from '../store/settingsStore';
import { sensorManager, watchSimulationSetting } from './manager';

/** Flips the switch in memory only; persistence isn't under test here. */
const setSimulate = (simulateSensors: boolean) =>
  useSettingsStore.setState((s) => ({ settings: { ...s.settings, simulateSensors } }));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});
afterEach(async () => {
  await sensorManager.reset();
  vi.useRealTimers();
});

describe('sensorManager', () => {
  it('mirrors a simulated sensor into the store', async () => {
    setSimulate(true);
    await sensorManager.connect('hr');
    expect(useSensorsStore.getState().hr).toMatchObject({
      status: 'connected',
      source: 'simulated',
      deviceName: 'Pulsómetro simulado',
    });
    vi.advanceTimersByTime(3000);
    expect(useSensorsStore.getState().hr.last?.atMs).toBe(3000);

    sensorManager.simulateDrop('hr');
    expect(useSensorsStore.getState().hr.status).toBe('reconnecting');
  });

  it('explains when Bluetooth is not available (Node has none)', async () => {
    setSimulate(false);
    await sensorManager.connect('csc');
    expect(useSensorsStore.getState().csc).toMatchObject({ status: 'error', source: 'ble' });
    expect(useSensorsStore.getState().csc.error).toMatch(/Bluetooth/);
  });

  it('drops current sensors when the simulation switch changes', async () => {
    setSimulate(true);
    const stop = watchSimulationSetting();
    await sensorManager.connect('hr');
    setSimulate(false);
    await vi.advanceTimersByTimeAsync(0);
    expect(useSensorsStore.getState().hr).toMatchObject({ status: 'disconnected', last: null });
    stop();
  });
});
