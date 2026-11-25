/**
 * One second of a session. Anything without a reading is null, never filled in.
 * `t` is moving time in whole seconds (pauses are not recorded).
 */
export interface RecordSample {
  t: number;
  hr: number | null;
  powerW: number | null;
  speedKmh: number | null;
  cadenceRpm: number | null;
  /** Cumulative distance: route distance, or real wheel distance without a route. */
  distanceM: number | null;
  altitudeM: number | null;
  lat: number | null;
  lon: number | null;
}

export type RecordReading = Omit<RecordSample, 't'>;

export interface Recording {
  /** Wall-clock start (ms since epoch); timestamps in exports count from here. */
  startMs: number;
  samples: RecordSample[];
  /** Time since the last whole second, carried to the next tick. */
  carrySec: number;
}

export function startRecording(startMs: number): Recording {
  return { startMs, samples: [], carrySec: 0 };
}

export const EMPTY_READING: RecordReading = {
  hr: null,
  powerW: null,
  speedKmh: null,
  cadenceRpm: null,
  distanceM: null,
  altitudeM: null,
  lat: null,
  lon: null,
};

/**
 * Adds `dtSec` of riding with the current `reading`: one sample per whole second
 * crossed. Appends to `samples` in place (a long session ticks thousands of times).
 */
export function recordTick(rec: Recording, dtSec: number, reading: RecordReading): Recording {
  let carrySec = rec.carrySec + Math.max(0, dtSec);
  while (carrySec >= 1) {
    carrySec -= 1;
    rec.samples.push({ t: rec.samples.length + 1, ...reading });
  }
  return { startMs: rec.startMs, samples: rec.samples, carrySec };
}

/** Which channels have at least one reading, to decide what to chart or export. */
export function channelsPresent(samples: readonly RecordSample[]) {
  const has = (k: keyof RecordReading) => samples.some((s) => s[k] !== null);
  return {
    hr: has('hr'),
    powerW: has('powerW'),
    speedKmh: has('speedKmh'),
    cadenceRpm: has('cadenceRpm'),
    distanceM: has('distanceM'),
    altitudeM: has('altitudeM'),
    position: samples.some((s) => s.lat !== null && s.lon !== null),
  };
}
