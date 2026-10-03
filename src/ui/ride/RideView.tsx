import { useRef, useState } from 'react';
import { beep, unlockAudio } from '../../audio/beeper';
import { say } from '../../audio/speech';
import { addHrSample, emptyHrTime } from '../../domain/metrics/hrTime';
import { emptyPowerSampler, samplePower } from '../../domain/metrics/power';
import {
  MIN_SAVED_SESSION_SEC,
  type SessionSummary,
  buildRideSummary,
} from '../../domain/metrics/summary';
import { positionAt } from '../../domain/route/position';
import { type RideMode, type RideState, advanceRide, startRide } from '../../domain/route/ride';
import type { Route } from '../../domain/route/route';
import { isFresh } from '../../sensors/freshness';
import { useHistoryStore } from '../../store/historyStore';
import { useSensorsStore } from '../../store/sensorsStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';
import ConfirmButton from '../ConfirmButton';
import { usePlayerClock } from '../hooks/usePlayerClock';
import { useWakeLock } from '../hooks/useWakeLock';
import SensorAlerts from '../player/SensorAlerts';
import Summary from '../player/Summary';
import ElevationProfile from './ElevationProfile';
import MiniMap from './MiniMap';
import ModeBadge from './ModeBadge';
import RideHud from './RideHud';
import { currentRideInput } from './rideInput';
import { RIDE_MODE_HINT } from './rideMode';

type Status = 'ready' | 'running' | 'paused';

/** Free ride on a route: race view with HUD, elevation profile and minimap. */
export default function RideView({ route, mode }: { route: Route; mode: RideMode }) {
  const addHistory = useHistoryStore((s) => s.add);
  const stopRide = useUiStore((s) => s.stopRide);
  const setTab = useUiStore((s) => s.setTab);
  const simulated = useSensorsStore((s) => s.csc.source === 'simulated');

  const [status, setStatus] = useState<Status>('ready');
  const [ride, setRide] = useState<RideState>(startRide);
  const rideRef = useRef(ride);
  const hrTime = useRef(emptyHrTime());
  const hrSimulated = useRef(false);
  const power = useRef(emptyPowerSampler());
  const powerSimulated = useRef(false);
  const [result, setResult] = useState<{ summary: SessionSummary; saved: boolean } | null>(null);

  const finish = (state: RideState) => {
    const { settings } = useSettingsStore.getState();
    const summary = buildRideSummary({
      id: crypto.randomUUID(),
      dateMs: Date.now(),
      route,
      ride: state,
      mode,
      weightKg: settings.athlete.weightKg,
      hr: hrTime.current,
      hrSimulated: hrSimulated.current,
      powerSamples: power.current.samples,
      powerSimulated: powerSimulated.current,
      ftpW: settings.athlete.ftp?.watts ?? null,
    });
    const saved = summary.durationSec >= MIN_SAVED_SESSION_SEC;
    if (saved) void addHistory(summary);
    if (settings.beeps) {
      beep(880, 150);
      beep(1175, 150, 0.18);
      beep(1568, 300, 0.36);
    }
    if (settings.voice) say(state.finished ? 'Ruta terminada' : 'Salida terminada');
    setResult({ summary, saved });
  };

  const running = status === 'running';
  usePlayerClock(running, (dt) => {
    const { settings } = useSettingsStore.getState();
    const { csc, hr } = useSensorsStore.getState();
    const now = Date.now();
    const { input, watts } = currentRideInput(mode, now);
    const next = advanceRide(rideRef.current, route, dt, input);

    const bpm = hr.last && isFresh(hr.last, now) ? hr.last.bpm : null;
    if (bpm !== null && hr.source === 'simulated') hrSimulated.current = true;
    hrTime.current = addHrSample(hrTime.current, bpm, dt, settings.athlete.hrZonesPer10s);
    if (watts !== null && csc.source === 'simulated') powerSimulated.current = true;
    power.current = samplePower(power.current, dt, watts);

    rideRef.current = next;
    setRide(next);
    if (next.finished) {
      setStatus('paused');
      finish(next);
    }
  });
  useWakeLock(running);

  const close = () => {
    stopRide();
    setTab('routes');
  };

  if (result) {
    return (
      <div className="overlay">
        <Summary summary={result.summary} saved={result.saved} onClose={close} />
      </div>
    );
  }

  const here = positionAt(route, ride.distanceM);
  const label = running ? 'Pausa' : status === 'ready' ? 'Empezar' : 'Reanudar';

  return (
    <div className="overlay">
      <div className="sheet ride">
        <div className="sheet-top">
          <h2>{route.name}</h2>
          <ModeBadge mode={mode} simulated={simulated} />
        </div>
        {status === 'ready' && <p className="note">{RIDE_MODE_HINT[mode]}</p>}

        <SensorAlerts />

        <RideHud
          mode={mode}
          grade={here.grade}
          speedKmh={ride.speedMs * 3.6}
          distanceM={ride.distanceM}
          totalM={route.distanceM}
          ascentM={ride.ascentM}
          elapsedSec={ride.elapsedSec}
        />

        <div className="ride-graphs">
          <div className="card ride-profile">
            <span className="tag">Perfil · próximos 500 m resaltados</span>
            <ElevationProfile route={route} positionM={ride.distanceM} height={150} />
          </div>
          <div className="card ride-map">
            <span className="tag">Recorrido</span>
            <MiniMap route={route} at={here} height={170} />
          </div>
        </div>

        <div className="controls">
          <button
            type="button"
            className="btn primary wide"
            onClick={() => {
              unlockAudio();
              setStatus(running ? 'paused' : 'running');
            }}
          >
            {label}
          </button>
          <ConfirmButton
            label="Terminar"
            armedLabel="¿Terminar? Pulsa otra vez"
            className="btn danger wide"
            onConfirm={() => {
              setStatus('paused');
              finish(rideRef.current);
            }}
          />
        </div>
      </div>
    </div>
  );
}
