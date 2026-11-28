import { type HrTime, addHrSample, emptyHrTime } from '../domain/metrics/hrTime';
import { type PowerSampler, emptyPowerSampler, samplePower } from '../domain/metrics/power';
import { type HrCap, isAboveCap } from '../domain/zones/hrCap';
import type { HrZone } from '../domain/zones/zones';
import { positionAt } from '../domain/route/position';
import type { RideState } from '../domain/route/ride';
import type { Route } from '../domain/route/route';
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
  /**
   * Time with a heart rate reading under a ceiling, and the part of it above.
   * Missing in sessions saved before phase 15a (read as 0).
   */
  capSec?: number;
  aboveCapSec?: number;
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
  /** Heart rate ceiling of the current block, if any. */
  cap?: HrCap | null;
}

export function startRecorder(startMs: number): RecorderState {
  return {
    hrTime: emptyHrTime(),
    hrSimulated: false,
    power: emptyPowerSampler(),
    powerSimulated: false,
    recording: startRecording(startMs),
    wheelDistanceM: 0,
    capSec: 0,
    aboveCapSec: 0,
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
  const capped = input.cap && input.bpm !== null ? input.cap : null;
  const above = capped !== null && input.bpm !== null && isAboveCap(input.bpm, capped, zones);
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
    capSec: (state.capSec ?? 0) + (capped ? dtSec : 0),
    aboveCapSec: (state.aboveCapSec ?? 0) + (above ? dtSec : 0),
  };
}

/** Recorder input for a rider `ride.distanceM` into `route` (looping or not). */
export function routeInputOf(
  route: Route,
  ride: RideState,
  loop: boolean,
): NonNullable<RecorderInput['route']> {
  const here = positionAt(route, ride.distanceM, loop);
  return {
    distanceM: ride.distanceM,
    speedKmh: ride.speedMs * 3.6,
    altitudeM: here.ele,
    lat: here.lat,
    lon: here.lon,
  };
}
