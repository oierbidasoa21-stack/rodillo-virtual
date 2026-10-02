import { CscCalculator } from '../cscCalculator';
import { parseCsc } from '../parse/csc';
import { type BleDeps, BleSensor } from './bleSensor';

/** Cycling Speed and Cadence (0x1816), CSC Measurement (0x2A5B). */
export class CscSensor extends BleSensor<'csc'> {
  protected readonly service = 'cycling_speed_and_cadence';
  protected readonly characteristic = 'csc_measurement';
  private calculator: CscCalculator;

  /** `wheelCircumferenceMm` is read on every packet so settings changes apply at once. */
  constructor(
    private readonly wheelCircumferenceMm: () => number,
    deps?: BleDeps,
  ) {
    super('csc', deps);
    this.calculator = new CscCalculator(wheelCircumferenceMm());
  }

  /** After a reconnection the first packet only sets a new baseline. */
  protected resetDecoding(): void {
    this.calculator = new CscCalculator(this.wheelCircumferenceMm());
  }

  protected handle(value: DataView, nowMs: number): void {
    this.calculator.setCircumference(this.wheelCircumferenceMm());
    this.emit({ atMs: nowMs, ...this.calculator.update(parseCsc(value), nowMs) });
  }
}
