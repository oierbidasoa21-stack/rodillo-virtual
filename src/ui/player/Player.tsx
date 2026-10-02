import { useCallback, useEffect, useRef, useState } from 'react';
import { unlockAudio } from '../../audio/beeper';
import { playCues } from '../../audio/cues';
import {
  MIN_SAVED_SESSION_SEC,
  type SessionSummary,
  buildSessionSummary,
} from '../../domain/metrics/summary';
import { expandWorkout } from '../../domain/workout/expand';
import {
  type Transition,
  addCount,
  createPlayer,
  currentStep,
  extendCurrent,
  finish,
  nextStep,
  progress,
  skip,
  tick,
  togglePlay,
} from '../../domain/workout/player';
import { BLOCK_KIND_LABELS, type Workout } from '../../domain/workout/types';
import { type HrZone, ZONE_META, findZone } from '../../domain/zones/zones';
import { useHistoryStore } from '../../store/historyStore';
import { useSimulationStore } from '../../store/simulationStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';
import ConfirmButton from '../ConfirmButton';
import { formatClock, zoneBpmText, zoneRangeText } from '../format';
import { usePlayerClock } from '../hooks/usePlayerClock';
import { useWakeLock } from '../hooks/useWakeLock';
import WorkoutProfile from '../WorkoutProfile';
import { needsDarkText, zoneColor } from '../zoneStyle';
import HrCounter from './HrCounter';
import LiveMetrics from './LiveMetrics';
import SensorAlerts from './SensorAlerts';
import Summary from './Summary';

/** Full-screen workout player, readable from a metre away. Ends in the summary. */
export default function Player({ workout }: { workout: Workout }) {
  const zones = useSettingsStore((s) => s.settings.athlete.hrZonesPer10s);
  const addHistory = useHistoryStore((s) => s.add);
  const stopPlayer = useUiStore((s) => s.stopPlayer);
  const setTab = useUiStore((s) => s.setTab);
  const showToast = useUiStore((s) => s.showToast);

  const [player, setPlayer] = useState(() => createPlayer(expandWorkout(workout.blocks)));
  const playerRef = useRef(player);
  // Target zone when the count was opened; the step may change while counting.
  const [countTarget, setCountTarget] = useState<HrZone | null>(null);
  const [result, setResult] = useState<{ summary: SessionSummary; saved: boolean } | null>(null);

  const apply = useCallback(
    (t: Transition) => {
      playerRef.current = t.state;
      setPlayer(t.state);
      const { settings } = useSettingsStore.getState();
      playCues(t.events, settings);
      if (t.events.some((e) => e.type === 'finished')) {
        const summary = buildSessionSummary({
          id: crypto.randomUUID(),
          dateMs: Date.now(),
          workoutName: workout.name,
          player: t.state,
          weightKg: settings.athlete.weightKg,
        });
        const saved = summary.durationSec >= MIN_SAVED_SESSION_SEC;
        if (saved) void addHistory(summary);
        setCountTarget(null);
        setResult({ summary, saved });
      }
    },
    [workout.name, addHistory],
  );

  const running = player.status === 'running';
  usePlayerClock(running, (dt) => apply(tick(playerRef.current, dt)));
  useWakeLock(running);

  // Simulated heart rate aims at the middle of the current block's zone.
  const simulate = useSettingsStore((s) => s.settings.simulateSensors);
  const followZone = useSimulationStore((s) => s.followZone);
  const stepZone = findZone(zones, currentStep(player).zoneId);
  useEffect(() => {
    if (!simulate || !followZone) return;
    const top = stepZone.max ?? stepZone.min + 1;
    useSimulationStore.getState().set({ targetBpm: Math.round(((stepZone.min + top) / 2) * 6) });
  }, [simulate, followZone, stepZone]);

  const close = () => {
    stopPlayer();
    setTab('library');
  };

  if (result) {
    return (
      <div className="overlay">
        <Summary summary={result.summary} saved={result.saved} onClose={close} />
      </div>
    );
  }

  const step = currentStep(player);
  const next = nextStep(player);
  const zone = findZone(zones, step.zoneId);
  const p = progress(player);
  const share = (p.doneSec / p.totalSec) * 100;
  const playLabel = running ? 'Pausa' : player.status === 'ready' ? 'Empezar' : 'Reanudar';

  return (
    <div className="overlay">
      <div className="sheet pl">
        <div className="sheet-top">
          <h2>{workout.name}</h2>
          <span className="pl-total num">
            Bloque {player.index + 1}/{player.steps.length} · Quedan{' '}
            <b>{formatClock(p.remainingTotalSec)}</b>
          </span>
        </div>

        <SensorAlerts />

        <WorkoutProfile steps={player.steps} big>
          <div className="shade" style={{ width: `${share}%` }} />
          <div className="cursor" style={{ left: `${share}%` }} />
        </WorkoutProfile>

        <div
          className={needsDarkText(zone.id) ? 'zonecard zt-dark' : 'zonecard'}
          style={{ background: zoneColor(zone.id) }}
        >
          <span className="k">
            {BLOCK_KIND_LABELS[step.kind]}
            {step.repeat && ` · ${step.repeat.index}/${step.repeat.times}`}
          </span>
          <span className="zn">{zone.id}</span>
          <span className="rng num">
            {zoneRangeText(zone)} · {zoneBpmText(zone)}
          </span>
          <span className="rpe">{ZONE_META[zone.id].feel}</span>
          {step.note && <span className="bnote">{step.note}</span>}
        </div>

        <div
          className={running && p.remainingInStepSec <= 10 ? 'clock num warn' : 'clock num'}
          role="timer"
        >
          {formatClock(Math.ceil(p.remainingInStepSec))}
        </div>

        <LiveMetrics zone={zone} />

        <div className="next">
          {next ? (
            <>
              <span className="t">
                <span className="sw" style={{ background: zoneColor(next.zoneId) }} />
                <span>
                  <span className="tag">Siguiente</span>
                  <br />
                  <b>{next.zoneId}</b> · {BLOCK_KIND_LABELS[next.kind]}
                </span>
              </span>
              <span className="dur num">{formatClock(next.durationSec)}</span>
            </>
          ) : (
            <span className="t">
              <span>
                <span className="tag">Siguiente</span>
                <br />
                <b>Fin de la sesión</b>
              </span>
            </span>
          )}
        </div>

        <div className="controls">
          <button
            type="button"
            className="btn primary wide"
            onClick={() => {
              unlockAudio();
              apply(togglePlay(playerRef.current));
            }}
          >
            {playLabel}
          </button>
          <button
            type="button"
            className="btn wide"
            onClick={() => {
              unlockAudio();
              setCountTarget(zone);
            }}
          >
            Contar pulso
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              apply(extendCurrent(playerRef.current));
              showToast('Bloque alargado 1 minuto');
            }}
          >
            +1′
          </button>
          <button type="button" className="btn" onClick={() => apply(skip(playerRef.current))}>
            Saltar
          </button>
          <ConfirmButton
            label="Terminar"
            armedLabel="¿Terminar? Pulsa otra vez"
            className="btn danger wide"
            onConfirm={() => apply(finish(playerRef.current))}
          />
        </div>
      </div>

      {countTarget && (
        <HrCounter
          target={countTarget}
          zones={zones}
          onCount={(v) => apply({ state: addCount(playerRef.current, v, countTarget), events: [] })}
          onClose={() => setCountTarget(null)}
        />
      )}
    </div>
  );
}
