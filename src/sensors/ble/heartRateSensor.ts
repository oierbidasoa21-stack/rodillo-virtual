import { parseHeartRate } from '../parse/heartRate';
import { type BleDeps, BleSensor } from './bleSensor';

/** Heart Rate Service (0x180D), Heart Rate Measurement (0x2A37). */
export class HeartRateSensor extends BleSensor<'hr'> {
  protected readonly service = 'heart_rate';
  protected readonly characteristic = 'heart_rate_measurement';

  constructor(deps?: BleDeps) {
    super('hr', deps);
  }

  protected handle(value: DataView, nowMs: number): void {
    this.emit({ atMs: nowMs, ...parseHeartRate(value) });
  }
}
