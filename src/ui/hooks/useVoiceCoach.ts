import { useMemo, useRef } from 'react';
import { climbCues, coachTick, finishSummary, startCoach } from '../../audio/coach';
import { beep } from '../../audio/beeper';
import { say } from '../../audio/speech';
import { hrCapTick, startHrCapAlarm } from '../../domain/workout/hrCapAlarm';
import { type HrCap, isAboveCap } from '../../domain/zones/hrCap';
import { findClimbs } from '../../domain/route/climbs';
import type { Route } from '../../domain/route/route';
import type { SessionSummary } from '../../domain/metrics/summary';
import { hasLoad } from '../../domain/metrics/summary';
import { type PlayerState, currentStep } from '../../domain/workout/player';
import { findZone, zoneStatus } from '../../domain/zones/zones';
import { isFresh } from '../../sensors/freshness';
import { useSensorsStore } from '../../store/sensorsStore';
import { useSettingsStore } from '../../store/settingsStore';

/** Said when the heart rate goes over the ceiling, and every 10 s while it stays over. */
export const HR_CAP_CUE = 'Pulso por encima del máximo: baja ya';

/**
 * Spoken coaching for a session: heart rate out of zone, halfway and last
 * minute of long blocks, climbs ahead on the route and a summary at the end,
 * plus the heart rate ceiling alarm (beeps and voice, each as set in Ajustes).
 * Silent when the voice is off in Ajustes.
 */
export function useVoiceCoach(route: Route | null) {
  const coach = useRef(startCoach());
  const capAlarm = useRef(startHrCapAlarm());
  const clockSec = useRef(0);
  const lastRouteM = useRef<number | null>(null);
  const climbs = useMemo(() => (route ? findClimbs(route) : []), [route]);

  const speak = (texts: string[]) => {
    if (texts.length && useSettingsStore.getState().settings.voice) say(texts.join('. '));
  };

  /**
   * Each running second of a workout. `cap` is the current block's heart rate
   * ceiling; over it, the alarm sounds at once and the zone cues stay quiet, so
   * the two never talk over each other. Returns whether the pulse is over it.
   */
  const workoutTick = (dtSec: number, player: PlayerState, cap: HrCap | null = null) => {
    clockSec.current += dtSec;
    const step = currentStep(player);
    const { settings } = useSettingsStore.getState();
    const last = useSensorsStore.getState().hr.last;
    const fresh = last && isFresh(last, Date.now()) ? last : null;
    const above = cap && fresh ? isAboveCap(fresh.bpm, cap, settings.athlete.hrZonesPer10s) : null;
    const alarm = hrCapTick(capAlarm.current, clockSec.current, above);
    capAlarm.current = alarm.state;
    if (alarm.alert) {
      if (settings.beeps) {
        beep(1320, 180);
        beep(1320, 180, 0.25);
        beep(1320, 180, 0.5);
      }
      if (settings.voice) say(HR_CAP_CUE);
    }
    const zone =
      step.target.type === 'hr'
        ? findZone(settings.athlete.hrZonesPer10s, step.target.zoneId)
        : null;
    const r = coachTick(coach.current, {
      nowSec: clockSec.current,
      stepIndex: player.index,
      stepKind: step.kind,
      elapsedInStepSec: player.elapsedInStepSec,
      stepDurationSec: step.durationSec,
      hrStatus: fresh && zone && !above ? zoneStatus(Math.round(fresh.bpm / 6), zone) : null,
    });
    coach.current = r.state;
    speak(r.say);
    return above === true;
  };

  /** Each tick on a route: announces the climbs ahead (laps wrap around). */
  const routeTick = (distanceM: number) => {
    if (!route || !climbs.length) return;
    const d = route.distanceM > 0 ? distanceM % route.distanceM : distanceM;
    const prev = lastRouteM.current;
    lastRouteM.current = d;
    if (prev === null) return;
    const texts =
      d >= prev
        ? climbCues(climbs, prev, d)
        : [...climbCues(climbs, prev, route.distanceM), ...climbCues(climbs, -1, d)];
    speak(texts);
  };

  /** The summary, said when the session ends. */
  const finished = (summary: SessionSummary) => {
    speak([
      finishSummary({
        durationSec: summary.durationSec,
        load: hasLoad(summary) ? summary.load : null,
        avgBpm: summary.hrMeasured?.avgBpm ?? null,
        distanceM: summary.ride?.distanceM ?? null,
      }),
    ]);
  };

  return { workoutTick, routeTick, finished };
}
