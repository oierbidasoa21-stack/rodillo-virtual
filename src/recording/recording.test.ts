import { describe, expect, it } from 'vitest';
import { EMPTY_READING, channelsPresent, recordTick, startRecording } from './recording';

describe('recordTick', () => {
  it('takes one sample per whole second from 200 ms ticks, numbering moving time', () => {
    let rec = startRecording(1000);
    for (let i = 0; i < 15; i++) rec = recordTick(rec, 0.2, { ...EMPTY_READING, hr: 120 });
    expect(rec.samples.map((s) => s.t)).toEqual([1, 2, 3]);
    expect(rec.samples[0]).toEqual({ ...EMPTY_READING, t: 1, hr: 120 });
    expect(rec.startMs).toBe(1000);
  });

  it('keeps missing readings as null and splits a long gap into seconds', () => {
    let rec = startRecording(0);
    rec = recordTick(rec, 2.5, { ...EMPTY_READING, speedKmh: 30 });
    rec = recordTick(rec, 0.5, EMPTY_READING);
    expect(rec.samples).toHaveLength(3);
    expect(rec.samples.map((s) => s.speedKmh)).toEqual([30, 30, null]);
    expect(rec.carrySec).toBeCloseTo(0, 9);
  });
});

describe('channelsPresent', () => {
  it('reports which data exist', () => {
    let rec = startRecording(0);
    rec = recordTick(rec, 1, { ...EMPTY_READING, hr: 130, lat: 1, lon: 2 });
    rec = recordTick(rec, 1, { ...EMPTY_READING, powerW: 200 });
    expect(channelsPresent(rec.samples)).toEqual({
      hr: true,
      powerW: true,
      speedKmh: false,
      cadenceRpm: false,
      distanceM: false,
      altitudeM: false,
      position: true,
    });
  });
});
