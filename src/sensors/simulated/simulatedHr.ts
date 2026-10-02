import { parseHeartRate } from '../parse/heartRate';
import { type SimClock, lagFactor, realClock } from './clock';
import { SimulatedSensor } from './simulatedSensor';

export interface SimHrControls {
  targetBpm: number;
}

const RESTING_BPM = 75;
/** Heart rate takes tens of seconds to settle after a change in effort. */
const HR_TAU_SEC = 20;

/** Encodes bpm as a Heart Rate Measurement with skin contact, like a real strap. */
function encodeHeartRate(bpm: number): DataView {
  const value = Math.max(0, Math.round(bpm));
  if (value <= 0xff) return new DataView(new Uint8Array([0x06, value]).buffer);
  const view = new DataView(new ArrayBuffer(3));
  view.setUint8(0, 0x07);
  view.setUint16(1, value, true);
  return view;
}

/** Heart rate that drifts towards a target with some noise. Readings go through the real decoder. */
export class SimulatedHrSensor extends SimulatedSensor<'hr'> {
  private bpm = RESTING_BPM;

  constructor(
    private readonly controls: () => SimHrControls,
    clock: SimClock = realClock,
    private readonly random: () => number = Math.random,
  ) {
    super('hr', 'Pulsómetro simulado', clock);
  }

  protected reset(): void {
    this.bpm = RESTING_BPM;
  }

  protected tick(dtSec: number): void {
    const target = this.controls().targetBpm;
    const noise = (this.random() - 0.5) * 2; // ±1 bpm
    this.bpm += (target - this.bpm) * lagFactor(dtSec, HR_TAU_SEC) + noise;
    const m = parseHeartRate(encodeHeartRate(this.bpm));
    this.emit({ atMs: this.clock.now(), ...m });
  }
}
