import { isFresh } from '../../sensors/freshness';
import { sensorManager } from '../../sensors/manager';
import type { SensorKind } from '../../sensors/types';
import { useSensorsStore } from '../../store/sensorsStore';
import { useEstimatedPower } from '../hooks/useEstimatedPower';
import { useNow } from '../hooks/useNow';
import { SENSOR_NAME, STATUS_LABEL, formatPer10s, formatSpeed } from './sensorText';

interface Props {
  kind: SensorKind;
  simulate: boolean;
}

/** One sensor: status, device, live value and connect/disconnect. */
export default function SensorCard({ kind, simulate }: Props) {
  const state = useSensorsStore((s) => s[kind]);
  const now = useNow();
  const power = useEstimatedPower();
  const busy = state.status === 'connecting';
  const linked = state.status === 'connected' || state.status === 'reconnecting';
  const fresh = isFresh(state.last, now);

  let live: string | null = null;
  if (fresh && state.last) {
    if ('bpm' in state.last) {
      live = `${state.last.bpm} ppm · ${formatPer10s(state.last.bpm)} /10″`;
    } else {
      const { speedKmh, cadenceRpm } = state.last;
      live = [
        speedKmh === null ? 'Velocidad: —' : formatSpeed(speedKmh),
        cadenceRpm === null ? 'Sin cadencia' : `${Math.round(cadenceRpm)} rpm`,
        ...(power.watts === null ? [] : [`${Math.round(power.watts)} W est.`]),
      ].join(' · ');
    }
  }

  return (
    <article className="card sensor-card">
      <div className="row1">
        <h3>
          {SENSOR_NAME[kind]}
          {simulate && <span className="sim-tag">SIMULADO</span>}
        </h3>
        <span className={`sensor-status st-${state.status}`}>{STATUS_LABEL[state.status]}</span>
      </div>
      {state.deviceName && <p>{state.deviceName}</p>}
      {linked && (
        <div className="sensor-live num" aria-live="polite">
          {live ?? 'Esperando datos…'}
        </div>
      )}
      {state.error && (
        <p className="msg error" role="alert">
          {state.error}
        </p>
      )}
      <div className="actions">
        {linked ? (
          <button type="button" className="btn" onClick={() => void sensorManager.disconnect(kind)}>
            Desconectar
          </button>
        ) : (
          <button
            type="button"
            className="btn primary"
            disabled={busy}
            onClick={() => void sensorManager.connect(kind)}
          >
            {busy ? 'Conectando…' : 'Conectar'}
          </button>
        )}
      </div>
    </article>
  );
}
