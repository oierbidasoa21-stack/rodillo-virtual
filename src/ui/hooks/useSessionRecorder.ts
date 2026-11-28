import { useRef } from 'react';
import { curveFor } from '../../domain/trainer/curves';
import type { HrCap } from '../../domain/zones/hrCap';
import {
  type RecorderInput,
  type RecorderState,
  recorderTick,
  startRecorder,
} from '../../recording/recorder';
import { estimatePowerW } from '../../sensors/estimatedPower';
import { isFresh } from '../../sensors/freshness';
import { useSensorsStore } from '../../store/sensorsStore';
import { useSettingsStore } from '../../store/settingsStore';

/**
 * Records a session from the live sensors: time in heart rate zones, estimated
 * power, one sample per second and wheel distance. Shared by the player and the
 * race view so both save the same data. `initial` resumes a saved session.
 */
export function useSessionRecorder(initial: RecorderState | null) {
  // A new session's start time is set on its first tick.
  const ref = useRef<RecorderState>(initial ?? startRecorder(0));

  /**
   * Advances by `dtSec`; `route` is the position on a route, if any, and `cap`
   * the heart rate ceiling of the current block.
   */
  const tick = (dtSec: number, route: RecorderInput['route'], cap: HrCap | null = null) => {
    const { settings } = useSettingsStore.getState();
    const { hr, csc } = useSensorsStore.getState();
    const now = Date.now();
    let r = ref.current;
    // A new session starts on the first tick, not when the screen opened.
    if (!initial && r.recording.samples.length === 0 && r.recording.carrySec === 0) {
      r = { ...r, recording: { ...r.recording, startMs: now - dtSec * 1000 } };
    }
    const bpm = hr.last && isFresh(hr.last, now) ? hr.last.bpm : null;
    const cscLast = csc.last && isFresh(csc.last, now) ? csc.last : null;
    ref.current = recorderTick(
      r,
      dtSec,
      {
        bpm,
        bpmSimulated: hr.source === 'simulated',
        watts: estimatePowerW(csc.last, curveFor(settings.trainer), now),
        wattsSimulated: csc.source === 'simulated',
        wheelSpeedKmh: cscLast?.speedKmh ?? null,
        cadenceRpm: cscLast?.cadenceRpm ?? null,
        route,
        cap,
      },
      settings.athlete.hrZonesPer10s,
    );
  };

  return { ref, tick };
}
