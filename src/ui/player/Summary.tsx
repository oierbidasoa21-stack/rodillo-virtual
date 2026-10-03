import type { ReactNode } from 'react';
import { KCAL_MET_UNCERTAINTY } from '../../domain/metrics/kcal';
import { type SessionSummary, hasKcal, hasLoad } from '../../domain/metrics/summary';
import { hrPer10sToBpm } from '../../domain/zones/heartRate';
import { ZONE_IDS } from '../../domain/zones/zones';
import { formatClock } from '../format';
import { zoneColor } from '../zoneStyle';
import RideSummaryCard from '../ride/RideSummaryCard';
import PowerSummaryCard from './PowerSummaryCard';
import { STATUS_CLASS, STATUS_TEXT } from './zoneStatusText';

interface Props {
  summary: SessionSummary;
  saved: boolean;
  onClose: () => void;
  /** Extra result shown first, e.g. the ramp test FTP. */
  children?: ReactNode;
}

export default function Summary({ summary, saved, onClose, children }: Props) {
  const { plannedSecByZone: plan, counts, hrMeasured: hr } = summary;
  // Measured by the heart rate sensor when there was enough of it, else the blocks ridden.
  const done = hr?.secByZone ?? summary.actualSecByZone;
  const maxSec = Math.max(1, ...ZONE_IDS.map((id) => Math.max(plan[id], done[id])));
  const inZone = counts.filter((c) => c.status === 'in').length;
  // A power-only session without a heart rate sensor has nothing to show per heart rate zone.
  const showHrZones = !!hr || ZONE_IDS.some((id) => plan[id] > 0);

  return (
    <div className="sheet">
      <div className="sheet-top">
        <h2>{summary.workoutName} · Resumen</h2>
        <button type="button" className="btn primary" onClick={onClose}>
          Volver a sesiones
        </button>
      </div>

      {children}

      <div className="stats" style={{ marginTop: 14 }}>
        <div className="stat">
          <div className="v num">{formatClock(summary.durationSec)}</div>
          <div className="l">Tiempo de sesión</div>
        </div>
        <div className="stat">
          <div className="v num">{hasLoad(summary) ? Math.round(summary.load) : '—'}</div>
          <div className="l">Carga (TRIMP por zonas)</div>
        </div>
        <div className="stat">
          <div className="v num">{hasKcal(summary) ? Math.round(summary.kcalEstimated) : '—'}</div>
          <div className="l">
            {summary.power
              ? 'kcal estimadas (≈ kJ)'
              : `kcal estimadas (±${Math.round(KCAL_MET_UNCERTAINTY * 100)} %)`}
          </div>
        </div>
        {hr && (
          <>
            <div className="stat">
              <div className="v num">{Math.round(hr.avgBpm)}</div>
              <div className="l">Pulso medio (ppm)</div>
            </div>
            <div className="stat">
              <div className="v num">{hr.maxBpm}</div>
              <div className="l">Pulso máximo (ppm)</div>
            </div>
          </>
        )}
        {counts.length > 0 && (
          <div className="stat">
            <div className="v num">
              {inZone}/{counts.length}
            </div>
            <div className="l">Conteos en zona</div>
          </div>
        )}
      </div>
      {!saved && (
        <p className="note">
          La sesión ha durado menos de 1 minuto y no se guarda en el historial.
        </p>
      )}

      {summary.ride && <RideSummaryCard ride={summary.ride} />}

      {summary.power && <PowerSummaryCard power={summary.power} />}

      {showHrZones && (
        <>
          <div className="sectionhead">
            <h2>Tiempo en cada zona</h2>
            <span className="tag">
              {hr ? 'Medido por pulsómetro' : 'Según los bloques realizados'}
              {hr?.simulated && <span className="sim-tag">SIMULADO</span>}
            </span>
          </div>
          <div className="card">
            {ZONE_IDS.map((id) => (
              <div className="zbar" key={id}>
                <b style={{ color: zoneColor(id) }}>{id}</b>
                <div className="bars">
                  <div className="track">
                    <div
                      className="fill"
                      style={{ width: `${(done[id] / maxSec) * 100}%`, background: zoneColor(id) }}
                    />
                  </div>
                  <div className="track plan">
                    <div className="fill" style={{ width: `${(plan[id] / maxSec) * 100}%` }} />
                  </div>
                </div>
                <span className="t num">
                  {formatClock(done[id])} <span className="note">/ {formatClock(plan[id])}</span>
                </span>
              </div>
            ))}
            <p className="note">
              Barra de color: lo realizado{hr ? ', según tu pulso' : ''}. Línea gris: lo
              planificado.
              {hr && hr.belowSec >= 1 && ` Además, ${formatClock(hr.belowSec)} por debajo de L1.`}
              {hr &&
                hr.coveredSec < summary.durationSec - 30 &&
                ` Hubo pulso durante ${formatClock(hr.coveredSec)} de ${formatClock(summary.durationSec)}.`}
            </p>
          </div>
        </>
      )}

      {counts.length > 0 && (
        <>
          <div className="sectionhead">
            <h2>Pulso contado</h2>
          </div>
          <div className="card">
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th>Minuto</th>
                    <th>Objetivo</th>
                    <th>/10″</th>
                    <th>ppm</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {counts.map((c, i) => (
                    <tr key={i}>
                      <td className="num">{formatClock(c.atSec)}</td>
                      <td>{c.targetZoneId}</td>
                      <td className="num">{c.valuePer10s}</td>
                      <td className="num">{hrPer10sToBpm(c.valuePer10s)}</td>
                      <td className={STATUS_CLASS[c.status]}>{STATUS_TEXT[c.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
