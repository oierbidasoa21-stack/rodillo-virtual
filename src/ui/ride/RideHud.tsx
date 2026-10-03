import type { RideMode } from '../../domain/route/ride';
import { isFresh } from '../../sensors/freshness';
import { useSensorsStore } from '../../store/sensorsStore';
import { formatClock } from '../format';
import { useEstimatedPower } from '../hooks/useEstimatedPower';
import { useNow } from '../hooks/useNow';
import { formatGrade, formatKm, gradeColor } from './rideFormat';

interface Props {
  mode: RideMode;
  grade: number;
  speedKmh: number;
  distanceM: number;
  totalM: number;
  ascentM: number;
  elapsedSec: number;
}

const oneDecimal = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Race view numbers, readable from a metre away. Missing data shows as "—". */
export default function RideHud(p: Props) {
  const hr = useSensorsStore((s) => s.hr.last);
  const csc = useSensorsStore((s) => s.csc.last);
  const now = useNow(500);
  const power = useEstimatedPower();
  const bpm = hr && isFresh(hr, now) ? hr.bpm : null;
  const cadence = csc && isFresh(csc, now) ? csc.cadenceRpm : null;

  return (
    <div className="hud">
      <div className="hud-grade" style={{ background: gradeColor(p.grade) }}>
        <span className="hud-l">Pendiente</span>
        <span className="hud-v num">{formatGrade(p.grade)}</span>
      </div>
      <div className="hud-cell">
        <span className="hud-l">Velocidad {p.mode === 'power' ? '(virtual)' : '(rueda)'}</span>
        <span className="hud-v num">{oneDecimal.format(p.speedKmh)}</span>
        <span className="hud-u">km/h</span>
      </div>
      <div className="hud-cell">
        <span className="hud-l">Potencia</span>
        {p.mode === 'power' && power.watts !== null ? (
          <>
            <span className="hud-v num">{Math.round(power.watts)}</span>
            <span className="hud-u">W est.</span>
          </>
        ) : (
          <span className="hud-v hud-none">{p.mode === 'wheel' ? 'Sin potencia' : '—'}</span>
        )}
      </div>
      <div className="hud-cell">
        <span className="hud-l">Pulso</span>
        <span className="hud-v num">{bpm ?? '—'}</span>
        {bpm !== null && <span className="hud-u">ppm</span>}
      </div>
      <div className="hud-cell">
        <span className="hud-l">Cadencia</span>
        <span className="hud-v num">{cadence === null ? '—' : Math.round(cadence)}</span>
        {cadence !== null && <span className="hud-u">rpm</span>}
      </div>
      <div className="hud-cell">
        <span className="hud-l">Distancia</span>
        <span className="hud-v num">{formatKm(p.distanceM)}</span>
        <span className="hud-u">de {formatKm(p.totalM)}</span>
      </div>
      <div className="hud-cell">
        <span className="hud-l">Quedan</span>
        <span className="hud-v num">{formatKm(Math.max(0, p.totalM - p.distanceM))}</span>
      </div>
      <div className="hud-cell">
        <span className="hud-l">Desnivel</span>
        <span className="hud-v num">+{Math.round(p.ascentM)}</span>
        <span className="hud-u">m</span>
      </div>
      <div className="hud-cell">
        <span className="hud-l">Tiempo</span>
        <span className="hud-v num">{formatClock(p.elapsedSec)}</span>
      </div>
    </div>
  );
}
