import { describe, expect, it } from 'vitest';
import { encodeCsc, parseCsc } from './csc';
import { parseHeartRate } from './heartRate';

const bytes = (...b: number[]) => new DataView(new Uint8Array(b).buffer);

describe('parseHeartRate', () => {
  it('reads an 8-bit value', () => {
    expect(parseHeartRate(bytes(0x00, 0x48))).toEqual({ bpm: 72, contact: null, rrMs: [] });
  });

  it('reads a 16-bit little-endian value', () => {
    expect(parseHeartRate(bytes(0x01, 0x96, 0x00)).bpm).toBe(150);
  });

  it('reports skin contact only when supported', () => {
    expect(parseHeartRate(bytes(0x06, 0x50)).contact).toBe(true);
    expect(parseHeartRate(bytes(0x04, 0x50)).contact).toBe(false);
    expect(parseHeartRate(bytes(0x02, 0x50)).contact).toBeNull();
  });

  it('skips energy expended and converts RR intervals to ms', () => {
    // flags: RR + energy; bpm 60; energy 0x0102; RR 1024/1024 s = 1000 ms, 512 → 500 ms
    const m = parseHeartRate(bytes(0x18, 0x3c, 0x02, 0x01, 0x00, 0x04, 0x00, 0x02));
    expect(m).toEqual({ bpm: 60, contact: null, rrMs: [1000, 500] });
  });
});

describe('parseCsc', () => {
  it('reads wheel and crank data', () => {
    // wheel revs 0x00010203, time 0x0405; crank revs 0x0607, time 0x0809
    const m = parseCsc(bytes(0x03, 0x03, 0x02, 0x01, 0x00, 0x05, 0x04, 0x07, 0x06, 0x09, 0x08));
    expect(m).toEqual({
      wheel: { revs: 0x010203, eventTime: 0x0405 },
      crank: { revs: 0x0607, eventTime: 0x0809 },
    });
  });

  it('reads speed-only and cadence-only sensors', () => {
    expect(parseCsc(bytes(0x01, 10, 0, 0, 0, 0, 4)).crank).toBeNull();
    expect(parseCsc(bytes(0x02, 5, 0, 0, 4)).wheel).toBeNull();
  });

  it('round-trips through the encoder', () => {
    const m = { wheel: { revs: 4294967295, eventTime: 65535 }, crank: { revs: 12, eventTime: 99 } };
    expect(parseCsc(encodeCsc(m))).toEqual(m);
    expect(parseCsc(encodeCsc({ wheel: m.wheel, crank: null }))).toEqual({
      wheel: m.wheel,
      crank: null,
    });
  });
});
