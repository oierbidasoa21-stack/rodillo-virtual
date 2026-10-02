import { useSensorsStore } from '../store/sensorsStore';
import { useSettingsStore } from '../store/settingsStore';
import { useSimulationStore } from '../store/simulationStore';
import { CscSensor } from './ble/cscSensor';
import { HeartRateSensor } from './ble/heartRateSensor';
import { SimulatedCscSensor } from './simulated/simulatedCsc';
import { SimulatedHrSensor } from './simulated/simulatedHr';
import type { Sensor, SensorKind } from './types';

type AnySensor = Sensor<'hr'> | Sensor<'csc'>;

const wheelMm = () => useSettingsStore.getState().settings.athlete.wheelCircumferenceMm;

function create(kind: SensorKind, simulate: boolean): AnySensor {
  if (kind === 'hr') {
    return simulate
      ? new SimulatedHrSensor(() => useSimulationStore.getState())
      : new HeartRateSensor();
  }
  return simulate
    ? new SimulatedCscSensor(() => ({
        ...useSimulationStore.getState(),
        wheelCircumferenceMm: wheelMm(),
      }))
    : new CscSensor(wheelMm);
}

/**
 * Owns one sensor per kind and mirrors its status and readings into the
 * sensors store. Real or simulated depends on Ajustes → Desarrollo.
 */
class SensorManager {
  private sensors = new Map<SensorKind, { sensor: AnySensor; unsubscribe: () => void }>();

  private ensure(kind: SensorKind): AnySensor {
    const existing = this.sensors.get(kind);
    if (existing) return existing.sensor;

    const sensor = create(kind, useSettingsStore.getState().settings.simulateSensors);
    const patch = useSensorsStore.getState().patch;
    const sync = () =>
      patch(kind, {
        status: sensor.status,
        source: sensor.source,
        deviceName: sensor.deviceName,
        error: sensor.error,
      });
    const offStatus = sensor.onStatus(sync);
    const offReading = (sensor as Sensor).onReading((last) => patch(kind, { last }));
    this.sensors.set(kind, { sensor, unsubscribe: () => (offStatus(), offReading()) });
    return sensor;
  }

  /** Real sensors open Chrome's device chooser: call from a click. */
  async connect(kind: SensorKind): Promise<void> {
    const sensor = this.ensure(kind);
    const done = sensor.connect();
    useSensorsStore.getState().patch(kind, { status: sensor.status, source: sensor.source });
    await done;
    useSensorsStore.getState().patch(kind, {
      status: sensor.status,
      deviceName: sensor.deviceName,
      error: sensor.error,
    });
  }

  async disconnect(kind: SensorKind): Promise<void> {
    await this.sensors.get(kind)?.sensor.disconnect();
  }

  /** Simulated sensors only: rehearse a lost connection. */
  simulateDrop(kind: SensorKind): void {
    const sensor = this.sensors.get(kind)?.sensor;
    if (sensor instanceof SimulatedHrSensor || sensor instanceof SimulatedCscSensor) {
      sensor.simulateDrop();
    }
  }

  /** Disconnects and forgets every sensor, e.g. when switching real ↔ simulated. */
  async reset(): Promise<void> {
    const entries = [...this.sensors.entries()];
    this.sensors.clear();
    const patch = useSensorsStore.getState().patch;
    for (const [kind, { sensor, unsubscribe }] of entries) {
      unsubscribe();
      await sensor.disconnect();
      patch(kind, {
        status: 'disconnected',
        source: null,
        deviceName: null,
        error: null,
        last: null,
      });
    }
  }
}

export const sensorManager = new SensorManager();

/** Resets sensors whenever the real/simulated switch changes. Call once at startup. */
export function watchSimulationSetting(): () => void {
  let simulate = useSettingsStore.getState().settings.simulateSensors;
  return useSettingsStore.subscribe((state) => {
    if (state.settings.simulateSensors === simulate) return;
    simulate = state.settings.simulateSensors;
    void sensorManager.reset();
  });
}
