import { useRef, useState } from 'react';
import { beep, unlockAudio } from '../../audio/beeper';
import { say } from '../../audio/speech';
import type { SessionSummary } from '../../domain/metrics/summary';
import { positionAt } from '../../domain/route/position';
import { type RideMode, type RideState, advanceRide, startRide } from '../../domain/route/ride';
import type { Route } from '../../domain/route/route';
import { routeInputOf } from '../../recording/recorder';
import { type SessionSnapshot, summaryFromSnapshot } from '../../recording/session';
import { useSensorsStore } from '../../store/sensorsStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';
import ConfirmButton from '../ConfirmButton';
import { useInProgressSaver } from '../hooks/useInProgressSaver';
import { usePlayerClock } from '../hooks/usePlayerClock';
import { useSessionRecorder } from '../hooks/useSessionRecorder';
import { useWakeLock } from '../hooks/useWakeLock';
import SensorAlerts from '../player/SensorAlerts';
import Summary from '../player/Summary';
import ElevationProfile from './ElevationProfile';
import MiniMap from './MiniMap';
import ModeBadge from './ModeBadge';
import RideHud from './RideHud';
import { currentRideInput } from './rideInput';
import { RIDE_MODE_HINT } from './rideMode';
import { saveFinishedSession } from '../session/saveSession';

type Status = 'ready' | 'running' | 'paused';
type RideSnapshot = Extract<SessionSnapshot, { kind: 'ride' }>;

/** Free ride on a route: race view with HUD, elevation profile and minimap. */
export default function RideView({
  route,
  mode,
  resume = null,
}: {
  route: Route;
  mode: RideMode;
  /** Session saved in progress to continue; it opens paused. */
  resume?: RideSnapshot | null;
}) {
  const stopRide = useUiStore((s) => s.stopRide);
  const setTab = useUiStore((s) => s.setTab);
  const simulated = useSensorsStore((s) => s.csc.source === 'simulated');

  const [status, setStatus] = useState<Status>(resume ? 'paused' : 'ready');
  const [ride, setRide] = useState<RideState>(() => resume?.ride ?? startRide());
  const rideRef = useRef(ride);
  const recorder = useSessionRecorder(resume?.recorder ?? null);
  const [result, setResult] = useState<{ summary: SessionSummary; saved: boolean } | null>(null);

  const snapshot = (): RideSnapshot => ({
    kind: 'ride',
    savedAtMs: Date.now(),
    route,
    mode,
    ride: rideRef.current,
    recorder: recorder.ref.current,
  });

  const finish = () => {
    const { settings } = useSettingsStore.getState();
    const state = rideRef.current;
    const summary = summaryFromSnapshot(snapshot(), {
      id: crypto.randomUUID(),
      dateMs: Date.now(),
      weightKg: settings.athlete.weightKg,
      ftpW: settings.athlete.ftp?.watts ?? null,
    });
    const saved = saveFinishedSession(summary, recorder.ref.current);
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
    const { input } = currentRideInput(mode, Date.now());
    const next = advanceRide(rideRef.current, route, dt, input);
    rideRef.current = next;
    recorder.tick(dt, routeInputOf(route, next, false));
    setRide(next);
    if (next.finished) {
      setStatus('paused');
      finish();
    }
  });
  useWakeLock(running);
  // Saved every 10 s, on pause and when the tab hides, until the summary.
  useInProgressSaver(status !== 'ready' && !result, running, snapshot);

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
              finish();
            }}
          />
        </div>
      </div>
    </div>
  );
}
