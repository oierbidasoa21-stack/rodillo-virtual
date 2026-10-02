import { useCallback, useEffect, useRef, useState } from 'react';
import { unlockAudio } from '../../audio/beeper';
import { playCues } from '../../audio/cues';
import {
  MIN_SAVED_SESSION_SEC,
  type SessionSummary,
  buildSessionSummary,
} from '../../domain/metrics/summary';
import { addHrSample, emptyHrTime } from '../../domain/metrics/hrTime';
import { emptyPowerSampler, samplePower } from '../../domain/metrics/power';
import { curveFor, speedForPowerKmh } from '../../domain/trainer/curves';
import { expandWorkout } from '../../domain/workout/expand';
import { type RampResult, ftpFromRamp, rampStepsCompleted } from '../../domain/workout/ramp';
import { targetWatts } from '../../domain/workout/targets';
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
import { BLOCK_KIND_LABELS, type Workout, hrZoneOf } from '../../domain/workout/types';
import { type HrZone, ZONE_META, findZone } from '../../domain/zones/zones';
import { estimatePowerW } from '../../sensors/estimatedPower';
import { isFresh } from '../../sensors/freshness';
import {
  SIM_REFERENCE_FTP_W,
  simulatedBpmForEffort,
  zoneMidBpm,
} from '../../sensors/simulated/follow';
import { useHistoryStore } from '../../store/historyStore';
import { useSensorsStore } from '../../store/sensorsStore';
import { useSimulationStore } from '../../store/simulationStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';
import ConfirmButton from '../ConfirmButton';
import { formatClock, zoneBpmText, zoneRangeText } from '../format';
import { usePlayerClock } from '../hooks/usePlayerClock';
import { useWakeLock } from '../hooks/useWakeLock';
import { targetColor, targetShortLabel } from '../targetStyle';
import WorkoutProfile from '../WorkoutProfile';
import { needsDarkText } from '../zoneStyle';
import RampResultCard from '../ramp/RampResultCard';
import HrCounter from './HrCounter';
import PowerTargetDetail from './PowerTargetDetail';
import LiveMetrics from './LiveMetrics';
import SensorAlerts from './SensorAlerts';
import Summary from './Summary';

/** Full-screen workout player, readable from a metre away. Ends in the summary. */
export default function Player({
  workout,
  mode = 'normal',
}: {
  workout: Workout;
  /** 'ramp': one-press stop and an FTP estimate at the end. */
  mode?: 'normal' | 'ramp';
}) {
  const zones = useSettingsStore((s) => s.settings.athlete.hrZonesPer10s);
  const addHistory = useHistoryStore((s) => s.add);
  const stopPlayer = useUiStore((s) => s.stopPlayer);
  const setTab = useUiStore((s) => s.setTab);
  const showToast = useUiStore((s) => s.showToast);

  const [player, setPlayer] = useState(() => createPlayer(expandWorkout(workout.blocks)));
  const playerRef = useRef(player);
  // Heart rate measured while the clock runs, and whether any of it was simulated.
  const hrTime = useRef(emptyHrTime());
  const hrSimulated = useRef(false);
  // Estimated power, one sample per second, and whether it came from a simulated sensor.
  const power = useRef(emptyPowerSampler());
  const powerSimulated = useRef(false);
  // Target zone when the count was opened; the step may change while counting.
  const [countTarget, setCountTarget] = useState<HrZone | null>(null);
  // The simulator as it was before this session, restored when it ends or the player closes.
  const [simBefore] = useState(() => {
    const { targetBpm, speedKmh, cadenceRpm } = useSimulationStore.getState();
    return { targetBpm, speedKmh, cadenceRpm };
  });
  useEffect(() => () => useSimulationStore.getState().set(simBefore), [simBefore]);
  const [result, setResult] = useState<{
    summary: SessionSummary;
    saved: boolean;
    ramp: RampResult | null;
    powerSimulated: boolean;
  } | null>(null);

  const apply = useCallback(
    (t: Transition) => {
      playerRef.current = t.state;
      setPlayer(t.state);
      const { settings } = useSettingsStore.getState();
      playCues(t.events, { ...settings, ftpW: settings.athlete.ftp?.watts ?? null });
      if (t.events.some((e) => e.type === 'finished')) {
        useSimulationStore.getState().set(simBefore);
        const summary = buildSessionSummary({
          id: crypto.randomUUID(),
          dateMs: Date.now(),
          workoutName: workout.name,
          player: t.state,
          weightKg: settings.athlete.weightKg,
          hr: hrTime.current,
          hrSimulated: hrSimulated.current,
          powerSamples: power.current.samples,
          powerSimulated: powerSimulated.current,
          ftpW: settings.athlete.ftp?.watts ?? null,
        });
        const saved = summary.durationSec >= MIN_SAVED_SESSION_SEC;
        if (saved) void addHistory(summary);
        const ramp =
          mode === 'ramp'
            ? ftpFromRamp(power.current.samples, rampStepsCompleted(t.state.index))
            : null;
        setCountTarget(null);
        setResult({ summary, saved, ramp, powerSimulated: powerSimulated.current });
      }
    },
    [workout.name, addHistory, mode, simBefore],
  );

  const running = player.status === 'running';
  usePlayerClock(running, (dt) => {
    const { hr } = useSensorsStore.getState();
    const bpm = hr.last && isFresh(hr.last, Date.now()) ? hr.last.bpm : null;
    if (bpm !== null && hr.source === 'simulated') hrSimulated.current = true;
    hrTime.current = addHrSample(
      hrTime.current,
      bpm,
      dt,
      useSettingsStore.getState().settings.athlete.hrZonesPer10s,
    );
    const { settings } = useSettingsStore.getState();
    const { csc } = useSensorsStore.getState();
    const watts = estimatePowerW(csc.last, curveFor(settings.trainer), Date.now());
    if (watts !== null && csc.source === 'simulated') powerSimulated.current = true;
    power.current = samplePower(power.current, dt, watts);
    apply(tick(playerRef.current, dt));
  });
  useWakeLock(running);

  // With simulated sensors and follow-zone on, the simulator rides the current block.
  const simulate = useSettingsStore((s) => s.settings.simulateSensors);
  const followZone = useSimulationStore((s) => s.followZone);
  // In power blocks, the simulated wheel spins at the speed that gives the target
  // watts on the chosen trainer, and heart rate drifts towards a matching zone.
  const trainer = useSettingsStore((s) => s.settings.trainer);
  const ftpW = useSettingsStore((s) => s.settings.athlete.ftp?.watts ?? null);
  const stepTarget = currentStep(player).target;
  useEffect(() => {
    if (!simulate || !followZone) return;
    const watts = targetWatts(stepTarget, ftpW);
    const curve = curveFor(trainer);
    if (watts === null || !curve) return;
    const speed = speedForPowerKmh(curve, watts);
    const effort = watts / (ftpW ?? SIM_REFERENCE_FTP_W);
    useSimulationStore.getState().set({
      ...(speed === null ? {} : { speedKmh: Math.round(speed * 10) / 10 }),
      targetBpm: simulatedBpmForEffort(effort, zones),
    });
  }, [simulate, followZone, stepTarget, ftpW, trainer, zones]);

  // In heart rate blocks, simulated heart rate aims at the middle of the block's zone.
  const stepHrZoneId = hrZoneOf(currentStep(player));
  const stepZone = stepHrZoneId ? findZone(zones, stepHrZoneId) : null;
  useEffect(() => {
    if (!simulate || !followZone || !stepZone) return;
    useSimulationStore.getState().set({ targetBpm: zoneMidBpm(stepZone) });
  }, [simulate, followZone, stepZone]);

  const close = () => {
    stopPlayer();
    setTab('library');
  };

  if (result) {
    return (
      <div className="overlay">
        <Summary summary={result.summary} saved={result.saved} onClose={close}>
          {mode === 'ramp' && (
            <RampResultCard result={result.ramp} simulated={result.powerSimulated} />
          )}
        </Summary>
      </div>
    );
  }

  const step = currentStep(player);
  const next = nextStep(player);
  const hrZoneId = hrZoneOf(step);
  // Heart rate zone of the block; null for power blocks.
  const zone = hrZoneId ? findZone(zones, hrZoneId) : null;
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

        <WorkoutProfile steps={player.steps} ftpW={ftpW} big>
          <div className="shade" style={{ width: `${share}%` }} />
          <div className="cursor" style={{ left: `${share}%` }} />
        </WorkoutProfile>

        <div
          className={zone && needsDarkText(zone.id) ? 'zonecard zt-dark' : 'zonecard'}
          style={{ background: targetColor(step.target, ftpW) }}
        >
          <span className="k">
            {mode === 'ramp' && player.index > 0
              ? `Escalón ${player.index}`
              : BLOCK_KIND_LABELS[step.kind]}
            {step.repeat && ` · ${step.repeat.index}/${step.repeat.times}`}
          </span>
          <span className="zn">{zone ? zone.id : targetShortLabel(step.target)}</span>
          {zone && (
            <>
              <span className="rng num">
                {zoneRangeText(zone)} · {zoneBpmText(zone)}
              </span>
              <span className="rpe">{ZONE_META[zone.id].feel}</span>
            </>
          )}
          {!zone && <PowerTargetDetail target={step.target} ftpW={ftpW} />}
          {step.note && <span className="bnote">{step.note}</span>}
        </div>

        <div
          className={running && p.remainingInStepSec <= 10 ? 'clock num warn' : 'clock num'}
          role="timer"
        >
          {formatClock(Math.ceil(p.remainingInStepSec))}
        </div>

        <LiveMetrics zone={zone} targetW={targetWatts(step.target, ftpW)} />

        <div className="next">
          {next ? (
            <>
              <span className="t">
                <span className="sw" style={{ background: targetColor(next.target) }} />
                <span>
                  <span className="tag">Siguiente</span>
                  <br />
                  <b>{targetShortLabel(next.target)}</b> · {BLOCK_KIND_LABELS[next.kind]}
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
            disabled={!zone}
            title={zone ? undefined : 'Solo en bloques por pulso'}
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
          {mode === 'ramp' ? (
            // At exhaustion a second press is too much to ask: one press ends the test.
            <button
              type="button"
              className="btn danger wide"
              onClick={() => apply(finish(playerRef.current))}
            >
              No puedo más
            </button>
          ) : (
            <ConfirmButton
              label="Terminar"
              armedLabel="¿Terminar? Pulsa otra vez"
              className="btn danger wide"
              onConfirm={() => apply(finish(playerRef.current))}
            />
          )}
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
