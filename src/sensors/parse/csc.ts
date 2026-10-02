/** Cumulative revolutions and the time of the last revolution, in 1/1024 s ticks. */
export interface RevolutionData {
  revs: number;
  eventTime: number;
}

/** Decoded CSC Measurement (characteristic 0x2A5B). Speed-only sensors send no crank data. */
export interface CscMeasurement {
  wheel: RevolutionData | null;
  crank: RevolutionData | null;
}

const WHEEL_PRESENT = 0x01;
const CRANK_PRESENT = 0x02;

export function parseCsc(view: DataView): CscMeasurement {
  const flags = view.getUint8(0);
  let offset = 1;
  let wheel: RevolutionData | null = null;
  let crank: RevolutionData | null = null;

  if (flags & WHEEL_PRESENT) {
    wheel = { revs: view.getUint32(offset, true), eventTime: view.getUint16(offset + 4, true) };
    offset += 6;
  }
  if (flags & CRANK_PRESENT) {
    crank = { revs: view.getUint16(offset, true), eventTime: view.getUint16(offset + 2, true) };
  }
  return { wheel, crank };
}

/** Encodes a CSC measurement. Used by the simulated sensor so it shares the real decoding path. */
export function encodeCsc(m: CscMeasurement): DataView {
  const size = 1 + (m.wheel ? 6 : 0) + (m.crank ? 4 : 0);
  const view = new DataView(new ArrayBuffer(size));
  let offset = 1;
  let flags = 0;
  if (m.wheel) {
    flags |= WHEEL_PRESENT;
    view.setUint32(offset, m.wheel.revs >>> 0, true);
    view.setUint16(offset + 4, m.wheel.eventTime & 0xffff, true);
    offset += 6;
  }
  if (m.crank) {
    flags |= CRANK_PRESENT;
    view.setUint16(offset, m.crank.revs & 0xffff, true);
    view.setUint16(offset + 2, m.crank.eventTime & 0xffff, true);
  }
  view.setUint8(0, flags);
  return view;
}
