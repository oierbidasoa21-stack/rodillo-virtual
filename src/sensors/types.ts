export type SensorKind = 'hr' | 'csc';

export type SensorStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

/** Where readings come from. The UI must label simulated data as such. */
export type SensorSource = 'ble' | 'simulated';

export interface HrReading {
  /** Wall-clock time the reading arrived (ms since epoch). */
  atMs: number;
  bpm: number;
  /** Skin contact, or null when the strap doesn't report it. */
  contact: boolean | null;
  /** Beat-to-beat intervals in ms, when the strap sends them. */
  rrMs: number[];
}

export interface CscReading {
  atMs: number;
  /** Null when the sensor sends no wheel data. */
  speedKmh: number | null;
  /** Null when the sensor sends no crank data (speed-only sensors). */
  cadenceRpm: number | null;
}

export interface ReadingByKind {
  hr: HrReading;
  csc: CscReading;
}

type Unsubscribe = () => void;

/**
 * Common interface for real and simulated sensors, so the UI never needs to
 * know which one it is talking to.
 */
export interface Sensor<K extends SensorKind = SensorKind> {
  readonly kind: K;
  readonly source: SensorSource;
  readonly status: SensorStatus;
  readonly deviceName: string | null;
  /** Last error, as a message for the user. */
  readonly error: string | null;
  /** Real sensors open the browser's device chooser, so call from a user gesture. */
  connect(): Promise<void>;
  /** Manual disconnect: no automatic reconnection afterwards. */
  disconnect(): Promise<void>;
  onReading(listener: (reading: ReadingByKind[K]) => void): Unsubscribe;
  onStatus(listener: (status: SensorStatus) => void): Unsubscribe;
}
