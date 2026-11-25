import { type HrTime, addHrSample, emptyHrTime } from '../domain/metrics/hrTime';
import { type PowerSampler, emptyPowerSampler, samplePower } from '../domain/metrics/power';
import type { HrZone } from '../domain/zones/zones';
import { type Recording, recordTick, startRecording } from './recording';

/** Everything a session accumulates while the clock runs. Serialisable, so it can be saved and resumed. */
export interface RecorderState {
  hrTime: HrTime;
  hrSimulated: boolean;
  power: PowerSampler;
  powerSimulated: boolean;
  recording: Recording;
  /** Real distance from the wheel sensor, used when there is no route. */
  wheelDistanceM: number;
}

/** Readings available on one tick. Null means no fresh reading. */
export interface RecorderInput {
  bpm: number | null;
  bpmSimulated: boolean;
  watts: number | null;
  wattsSimulated: boolean;
  wheelSpeedKmh: number | null;
  cadenceRpm: number | null;
  /** Position on a route, if riding one: its distance and speed replace the wheel's. */
  route: {
    distanceM: number;
    speedKmh: number;
    altitudeM: number;
    lat: number;
    lon: number;
  } | null;
}

export function startRecorder(startMs: number): RecorderState {
  return {
    hrTime: emptyHrTime(),
    hrSimulated: false,
    power: emptyPowerSampler(),
    powerSimulated: false,
    recording: startRecording(startMs),
    wheelDistanceM: 0,
  };
}

/** Advances the recorder by `dtSec` with the current readings. */
export function recorderTick(
  state: RecorderState,
  dtSec: number,
  input: RecorderInput,
  zones: readonly HrZone[],
): RecorderState {
  const wheelDistanceM =
    state.wheelDistanceM + (input.wheelSpeedKmh !== null ? (input.wheelSpeedKmh / 3.6) * dtSec : 0);
  const hasWheel = input.wheelSpeedKmh !== null || state.wheelDistanceM > 0;
  const r = input.route;
  return {
    hrTime: addHrSample(state.hrTime, input.bpm, dtSec, zones),
    hrSimulated: state.hrSimulated || (input.bpm !== null && input.bpmSimulated),
    power: samplePower(state.power, dtSec, input.watts),
    powerSimulated: state.powerSimulated || (input.watts !== null && input.wattsSimulated),
    recording: recordTick(state.recording, dtSec, {
      hr: input.bpm,
      powerW: input.watts,
      speedKmh: r ? r.speedKmh : input.wheelSpeedKmh,
      cadenceRpm: input.cadenceRpm,
      distanceM: r ? r.distanceM : hasWheel ? wheelDistanceM : null,
      altitudeM: r ? r.altitudeM : null,
      lat: r ? r.lat : null,
      lon: r ? r.lon : null,
    }),
    wheelDistanceM,
  };
}
