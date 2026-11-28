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
  notSeen: 'No se ha encontrado el sensor de la última vez. Pulsa Conectar para elegirlo.',
} as const;

/** How long to listen for a remembered sensor before giving up. */
export const REMEMBERED_WAIT_MS = 30_000;

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
  /** Chrome's id of the device, stable for this site while its permission lasts. */
  private _deviceId: string | null = null;
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
      this.adopt(device);
      await this.openGatt();
    } catch (error) {
      const cancelled = error instanceof DOMException && error.name === 'NotFoundError';
      this.setStatus(
        cancelled && !this.device ? 'disconnected' : 'error',
        cancelled ? BLE_MESSAGES.cancelled : BLE_MESSAGES.failed,
      );
    }
  }

  get deviceId(): string | null {
    return this._deviceId;
  }

  /**
   * Reconnects to a sensor chosen on an earlier visit without opening Chrome's
   * chooser. Needs `navigator.bluetooth.getDevices()` (Chrome's flag
   * «Use the new permissions backend for Web Bluetooth»); without it, returns
   * false and the user presses Conectar as before. With `watchAdvertisements()`
   * it waits up to 30 s for the sensor to be in range; otherwise it tries once.
   */
  async reconnectRemembered(deviceId: string): Promise<boolean> {
    const bt = this.deps.bluetooth;
    if (!bt?.getDevices) return false;
    if (this.status === 'connected' || this.status === 'connecting') return true;
    let device: BluetoothDevice | undefined;
    try {
      device = (await bt.getDevices()).find((d) => d.id === deviceId);
    } catch {
      return false;
    }
    if (!device) return false;
    this.manual = false;
    this.setStatus('connecting');
    this.adopt(device);
    try {
      // Typed as always there, but only exists with Chrome's experimental flag.
      if (typeof device.watchAdvertisements === 'function') await this.waitForAdvertisement(device);
      await this.openGatt();
      return true;
    } catch {
      this.forgetDevice();
      this._deviceId = null;
      this.setStatus('disconnected', BLE_MESSAGES.notSeen);
      return false;
    }
  }

  /** Resolves when the device advertises (it is on and in range), or rejects after 30 s. */
  private waitForAdvertisement(device: BluetoothDevice): Promise<void> {
    const abort = new AbortController();
    return new Promise<void>((resolve, reject) => {
      const timer = this.deps.clock.setTimeout(() => {
        abort.abort();
        reject(new Error('not seen'));
      }, REMEMBERED_WAIT_MS);
      device.addEventListener(
        'advertisementreceived',
        () => {
          this.deps.clock.clearTimeout(timer);
          abort.abort();
          resolve();
        },
        { once: true },
      );
      device.watchAdvertisements({ signal: abort.signal }).catch((error: unknown) => {
        this.deps.clock.clearTimeout(timer);
        reject(error instanceof Error ? error : new Error('watch failed'));
      });
    });
  }

  private adopt(device: BluetoothDevice): void {
    this.forgetDevice();
    this.device = device;
    this._deviceId = device.id;
    this._deviceName = device.name ?? 'Sensor';
    device.addEventListener('gattserverdisconnected', this.onGattDisconnected);
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
    this._deviceId = null;
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
