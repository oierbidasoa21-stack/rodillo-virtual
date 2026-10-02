import type { ReadingByKind, Sensor, SensorKind, SensorSource, SensorStatus } from './types';

/** Listener bookkeeping and status handling shared by every sensor. */
export abstract class SensorBase<K extends SensorKind> implements Sensor<K> {
  private readingListeners = new Set<(reading: ReadingByKind[K]) => void>();
  private statusListeners = new Set<(status: SensorStatus) => void>();
  private _status: SensorStatus = 'disconnected';
  protected _deviceName: string | null = null;
  protected _error: string | null = null;

  constructor(
    readonly kind: K,
    readonly source: SensorSource,
  ) {}

  get status(): SensorStatus {
    return this._status;
  }
  get deviceName(): string | null {
    return this._deviceName;
  }
  get error(): string | null {
    return this._error;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;

  onReading(listener: (reading: ReadingByKind[K]) => void): () => void {
    this.readingListeners.add(listener);
    return () => this.readingListeners.delete(listener);
  }

  onStatus(listener: (status: SensorStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  protected setStatus(status: SensorStatus, error: string | null = null): void {
    this._error = error;
    if (status === this._status) return;
    this._status = status;
    for (const listener of this.statusListeners) listener(status);
  }

  protected emit(reading: ReadingByKind[K]): void {
    for (const listener of this.readingListeners) listener(reading);
  }
}
