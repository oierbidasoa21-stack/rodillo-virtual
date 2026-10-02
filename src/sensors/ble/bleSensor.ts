import { SensorBase } from '../sensorBase';
import { type SimClock as Clock, realClock } from '../simulated/clock';
import type { SensorKind } from '../types';

/** Waits between reconnection attempts; the last one repeats until it works. */
export const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 16000, 30000] as const;

export const BLE_MESSAGES = {
  unsupported: 'Este navegador no permite Bluetooth. Usa Chrome en el ordenador.',
  unavailable: 'El Bluetooth del ordenador está apagado o no está disponible.',
  cancelled: 'No se eligió ningún sensor.',
  failed:
    'No se pudo conectar. Comprueba que el sensor está encendido, cerca y sin conectar a otro dispositivo.',
} as const;

export interface BleDeps {
  bluetooth: Bluetooth | undefined;
  clock: Clock;
}

const defaultDeps = (): BleDeps => ({
  bluetooth: typeof navigator === 'undefined' ? undefined : navigator.bluetooth,
  clock: realClock,
});

/**
 * One GATT notification characteristic over Web Bluetooth. If the link drops
 * without the user asking, it keeps retrying (1, 2, 4… 30 s) until it comes back
 * or the user disconnects.
 */
export abstract class BleSensor<K extends SensorKind> extends SensorBase<K> {
  protected abstract readonly service: BluetoothServiceUUID;
  protected abstract readonly characteristic: BluetoothCharacteristicUUID;
  /** Decodes one notification and emits a reading. */
  protected abstract handle(value: DataView, nowMs: number): void;
  /** Called after every (re)connection, e.g. to drop stale baselines. */
  protected resetDecoding(): void {}

  private device: BluetoothDevice | null = null;
  private char: BluetoothRemoteGATTCharacteristic | null = null;
  private manual = false;
  private attempt = 0;
  private retryTimer: unknown = null;

  constructor(
    kind: K,
    private readonly deps: BleDeps = defaultDeps(),
  ) {
    super(kind, 'ble');
  }

  async connect(): Promise<void> {
    const bt = this.deps.bluetooth;
    if (!bt) return this.setStatus('error', BLE_MESSAGES.unsupported);
    if (this.status === 'connected' || this.status === 'connecting') return;
    this.manual = false;
    this.setStatus('connecting');

    try {
      if (bt.getAvailability && !(await bt.getAvailability())) {
        return this.setStatus('error', BLE_MESSAGES.unavailable);
      }
      const device = await bt.requestDevice({ filters: [{ services: [this.service] }] });
      this.forgetDevice();
      this.device = device;
      this._deviceName = device.name ?? 'Sensor';
      device.addEventListener('gattserverdisconnected', this.onGattDisconnected);
      await this.openGatt();
    } catch (error) {
      const cancelled = error instanceof DOMException && error.name === 'NotFoundError';
      this.setStatus(
        cancelled && !this.device ? 'disconnected' : 'error',
        cancelled ? BLE_MESSAGES.cancelled : BLE_MESSAGES.failed,
      );
    }
  }

  async disconnect(): Promise<void> {
    this.manual = true;
    this.deps.clock.clearTimeout(this.retryTimer);
    this.retryTimer = null;
    const char = this.char;
    this.char = null;
    if (char) {
      char.removeEventListener('characteristicvaluechanged', this.onValue);
      await char.stopNotifications().catch(() => undefined);
    }
    if (this.device?.gatt?.connected) this.device.gatt.disconnect();
    this.forgetDevice();
    this._deviceName = null;
    this.setStatus('disconnected');
  }

  private async openGatt(): Promise<void> {
    const gatt = this.device?.gatt;
    if (!gatt) throw new Error('Device has no GATT server');
    const server = await gatt.connect();
    const service = await server.getPrimaryService(this.service);
    const char = await service.getCharacteristic(this.characteristic);
    char.addEventListener('characteristicvaluechanged', this.onValue);
    await char.startNotifications();
    this.char = char;
    this.attempt = 0;
    this.resetDecoding();
    this.setStatus('connected');
  }

  private forgetDevice(): void {
    this.device?.removeEventListener('gattserverdisconnected', this.onGattDisconnected);
    this.device = null;
  }

  private readonly onValue = (event: Event) => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic | null)?.value;
    if (value) this.handle(value, this.deps.clock.now());
  };

  private readonly onGattDisconnected = () => {
    if (this.manual) return;
    this.char?.removeEventListener('characteristicvaluechanged', this.onValue);
    this.char = null;
    this.setStatus('reconnecting');
    this.scheduleRetry();
  };

  private scheduleRetry(): void {
    const delay = RETRY_DELAYS_MS[Math.min(this.attempt, RETRY_DELAYS_MS.length - 1)] ?? 30_000;
    this.attempt += 1;
    this.retryTimer = this.deps.clock.setTimeout(() => {
      this.retryTimer = null;
      if (this.manual) return;
      this.openGatt().catch(() => {
        if (!this.manual) this.scheduleRetry();
      });
    }, delay);
  }
}
