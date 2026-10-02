import { CscCalculator } from '../cscCalculator';
import { encodeCsc, parseCsc } from '../parse/csc';
import { type SimClock, lagFactor, realClock } from './clock';
import { SimulatedSensor } from './simulatedSensor';

export interface SimCscControls {
  speedKmh: number;
  cadenceRpm: number;
  /** Off simulates a speed-only sensor (no crank data at all). */
  cadenceEnabled: boolean;
  wheelCircumferenceMm: number;
}

const SPEED_TAU_SEC = 3;
const CADENCE_TAU_SEC = 2;
const TICKS_PER_SEC = 1024;

/**
 * Cumulative revolutions plus the time of the last whole one, as a real sensor
 * reports them. `revs` is fractional internally; packets carry the whole part.
 */
class Revolutions {
  revs = 0;
  /** Seconds since connect at which the last whole revolution happened. */
  lastEventSec = 0;

  advance(revsPerSec: number, tSec: number, dtSec: number): void {
    const before = Math.floor(this.revs);
    this.revs += revsPerSec * dtSec;
    const after = Math.floor(this.revs);
    if (after > before && revsPerSec > 0) {
      // Time at which the revolution count crossed `after`.
      this.lastEventSec = tSec - (this.revs - after) / revsPerSec;
    }
  }

  packet() {
    return {
      revs: Math.floor(this.revs),
      eventTime: Math.round(this.lastEventSec * TICKS_PER_SEC) % 2 ** 16,
    };
  }
}

/** Wheel speed and cadence sensor. Packets go through the real decoder and calculator. */
export class SimulatedCscSensor extends SimulatedSensor<'csc'> {
  private speedKmh = 0;
  private cadenceRpm = 0;
  private tSec = 0;
  private wheel = new Revolutions();
  private crank = new Revolutions();
  private calculator: CscCalculator;

  constructor(
    private readonly controls: () => SimCscControls,
    clock: SimClock = realClock,
  ) {
    super('csc', 'Sensor de velocidad simulado', clock);
    this.calculator = new CscCalculator(controls().wheelCircumferenceMm);
  }

  protected reset(): void {
    this.speedKmh = 0;
    this.cadenceRpm = 0;
    this.tSec = 0;
    this.wheel = new Revolutions();
    this.crank = new Revolutions();
    this.calculator = new CscCalculator(this.controls().wheelCircumferenceMm);
  }

  protected tick(dtSec: number): void {
    const c = this.controls();
    this.tSec += dtSec;
    this.speedKmh += (c.speedKmh - this.speedKmh) * lagFactor(dtSec, SPEED_TAU_SEC);
    this.cadenceRpm += (c.cadenceRpm - this.cadenceRpm) * lagFactor(dtSec, CADENCE_TAU_SEC);

    const metresPerRev = c.wheelCircumferenceMm / 1000;
    this.wheel.advance(this.speedKmh / 3.6 / metresPerRev, this.tSec, dtSec);
    this.crank.advance(this.cadenceRpm / 60, this.tSec, dtSec);

    const packet = encodeCsc({
      wheel: this.wheel.packet(),
      crank: c.cadenceEnabled ? this.crank.packet() : null,
    });
    this.calculator.setCircumference(c.wheelCircumferenceMm);
    const now = this.clock.now();
    this.emit({ atMs: now, ...this.calculator.update(parseCsc(packet), now) });
  }
}
