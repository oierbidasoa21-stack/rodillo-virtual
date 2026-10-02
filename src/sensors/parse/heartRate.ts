/** Decoded Heart Rate Measurement (characteristic 0x2A37). */
export interface HrMeasurement {
  bpm: number;
  /** Null when the strap doesn't support contact detection. */
  contact: boolean | null;
  /** RR intervals converted from 1/1024 s to ms. */
  rrMs: number[];
}

const HR_16_BIT = 0x01;
const CONTACT_DETECTED = 0x02;
const CONTACT_SUPPORTED = 0x04;
const ENERGY_PRESENT = 0x08;
const RR_PRESENT = 0x10;

export function parseHeartRate(view: DataView): HrMeasurement {
  const flags = view.getUint8(0);
  let offset = 1;

  let bpm: number;
  if (flags & HR_16_BIT) {
    bpm = view.getUint16(offset, true);
    offset += 2;
  } else {
    bpm = view.getUint8(offset);
    offset += 1;
  }

  const contact = flags & CONTACT_SUPPORTED ? (flags & CONTACT_DETECTED) !== 0 : null;
  if (flags & ENERGY_PRESENT) offset += 2;

  const rrMs: number[] = [];
  if (flags & RR_PRESENT) {
    for (; offset + 1 < view.byteLength; offset += 2) {
      rrMs.push(Math.round((view.getUint16(offset, true) * 1000) / 1024));
    }
  }
  return { bpm, contact, rrMs };
}
