import { Suspense, lazy, useRef, useState } from 'react';
import { beep, unlockAudio } from '../../audio/beeper';
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
import { useVoiceCoach } from '../hooks/useVoiceCoach';
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
import { hasWebGL } from '../world/webgl';
import { TIME_OF_DAY_LABEL, type TimeOfDay } from '../world/timeOfDay';

// Three.js is big: the 3D view loads only when it is first shown.
const World3D = lazy(() => import('../world/World3D'));
const HOURS: TimeOfDay[] = ['morning', 'noon', 'evening'];

/** Constant power the demo rides at, with the usual physics. */
const DEMO_WATTS = 200;

type Status = 'ready' | 'running' | 'paused';
type RideSnapshot = Extract<SessionSnapshot, { kind: 'ride' }>;

/**
 * Free ride on a route: 3D world (or the 2D race view) with the HUD, elevation
 * profile and minimap. In demo mode it rides by itself at a simulated power and
 * saves nothing.
 */
export default function RideView({
  route,
  mode,
  resume = null,
  demo = false,
}: {
  route: Route;
  mode: RideMode;
  /** Session saved in progress to continue; it opens paused. */
  resume?: RideSnapshot | null;
  /** Rides at DEMO_WATTS simulated, without sensors; nothing is recorded or saved. */
  demo?: boolean;
}) {
  const stopRide = useUiStore((s) => s.stopRide);
  const setTab = useUiStore((s) => s.setTab);
  const simulated = useSensorsStore((s) => s.csc.source === 'simulated');
  const cscLast = useSensorsStore((s) => s.csc.last);
  const [webgl] = useState(hasWebGL);
  const [view, setView] = useState<'3d' | '2d'>(webgl ? '3d' : '2d');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');

  const [status, setStatus] = useState<Status>(demo ? 'running' : resume ? 'paused' : 'ready');
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

  const voice = useVoiceCoach(route);

  const finish = () => {
    if (demo) return; // the demo stops where it is and saves nothing
    const { settings } = useSettingsStore.getState();
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
    voice.finished(summary);
    setResult({ summary, saved });
  };

  const running = status === 'running';
  usePlayerClock(running, (dt) => {
    const { settings } = useSettingsStore.getState();
    const input = demo
      ? {
          mode: 'power' as const,
          powerW: DEMO_WATTS,
          massKg: settings.athlete.weightKg + settings.athlete.bikeWeightKg,
        }
      : currentRideInput(mode, Date.now()).input;
    const next = advanceRide(rideRef.current, route, dt, input);
    rideRef.current = next;
    if (!demo) recorder.tick(dt, routeInputOf(route, next, false));
    setRide(next);
    voice.routeTick(next.distanceM);
    if (next.finished) {
      setStatus('paused');
      finish();
    }
  });
  useWakeLock(running);
  // Saved every 10 s, on pause and when the tab hides, until the summary.
  useInProgressSaver(!demo && status !== 'ready' && !result, running, snapshot);

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
  const in3d = view === '3d';
  // Only for the pedalling animation; null pedals at a natural cadence.
  const cadence = !demo && cscLast?.cadenceRpm != null ? cscLast.cadenceRpm : null;
  const hud = (
    <RideHud
      mode={demo ? 'power' : mode}
      grade={here.grade}
      speedKmh={ride.speedMs * 3.6}
      distanceM={ride.distanceM}
      totalM={route.distanceM}
      ascentM={ride.ascentM}
      elapsedSec={ride.elapsedSec}
      {...(demo ? { demoWatts: DEMO_WATTS } : {})}
    />
  );

  return (
    <div className="overlay">
      <div className={in3d ? 'sheet ride ride-3d' : 'sheet ride'}>
        <div className="sheet-top">
          <h2>{route.name}</h2>
          <span className="ride-badges">
            {demo ? (
              <span className="mode-badge mode-demo" role="status">
                DEMO · {DEMO_WATTS} W simulados · no se guarda
              </span>
            ) : (
              <ModeBadge mode={mode} simulated={simulated} />
            )}
            {in3d && (
              <select
                className="time-of-day"
                aria-label="Hora del día"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {TIME_OF_DAY_LABEL[h]}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              className="btn"
              disabled={!webgl}
              title={webgl ? undefined : 'Este navegador no puede mostrar 3D (sin WebGL)'}
              onClick={() => setView(in3d ? '2d' : '3d')}
            >
              {in3d ? 'Vista 2D' : 'Vista 3D'}
            </button>
          </span>
        </div>
        {!demo && status === 'ready' && <p className="note">{RIDE_MODE_HINT[mode]}</p>}
        {!webgl && <p className="note">Este navegador no puede mostrar la vista 3D (sin WebGL).</p>}
        {demo && ride.finished && <p className="note">Demo terminada: has llegado al final.</p>}

        {!demo && <SensorAlerts />}

        {in3d ? (
          <div className="world-stage">
            <Suspense fallback={<p className="world-loading">Cargando el mundo 3D…</p>}>
              <World3D
                route={route}
                distanceM={ride.distanceM}
                speedMs={ride.speedMs}
                cadenceRpm={cadence}
                running={running}
                timeOfDay={timeOfDay}
              />
            </Suspense>
            <div className="world-hud">{hud}</div>
          </div>
        ) : (
          hud
        )}

        <div className="ride-graphs">
          <div className="card ride-profile">
            <span className="tag">Perfil · próximos 500 m resaltados</span>
            <ElevationProfile route={route} positionM={ride.distanceM} height={in3d ? 80 : 150} />
          </div>
          <div className="card ride-map">
            <span className="tag">Recorrido</span>
            <MiniMap route={route} at={here} height={in3d ? 90 : 170} />
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
          {demo ? (
            <button type="button" className="btn danger wide" onClick={close}>
              Salir de la demo
            </button>
          ) : (
            <ConfirmButton
              label="Terminar"
              armedLabel="¿Terminar? Pulsa otra vez"
              className="btn danger wide"
              onConfirm={() => {
                setStatus('paused');
                finish();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
