import { useState } from 'react';
import { recentTotals } from '../../domain/metrics/summary';
import { useHistoryStore } from '../../store/historyStore';
import ConfirmButton from '../ConfirmButton';
import { formatMinutes } from '../format';

const dateFormat = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' });

export default function HistoryView() {
  const sessions = useHistoryStore((s) => s.sessions);
  const clear = useHistoryStore((s) => s.clear);
  // Captured once per mount so the 7-day window doesn't shift while rendering.
  const [now] = useState(() => Date.now());

  if (!sessions.length) {
    return (
      <>
        <div className="sectionhead">
          <h2>Historial</h2>
        </div>
        <p className="note">
          Aquí aparecerá cada sesión que termines, con su duración, carga y kcal estimadas. El
          historial se guarda solo en este navegador.
        </p>
      </>
    );
  }

  const week = recentTotals(sessions, now);
  return (
    <>
      <div className="sectionhead">
        <h2>Historial</h2>
        <ConfirmButton label="Borrar historial" onConfirm={() => void clear()} />
      </div>
      <div className="stats" style={{ marginBottom: 14 }}>
        <div className="stat">
          <div className="v num">{week.count}</div>
          <div className="l">Sesiones, últimos 7 días</div>
        </div>
        <div className="stat">
          <div className="v num">{formatMinutes(week.durationSec)}</div>
          <div className="l">Tiempo, 7 días</div>
        </div>
        <div className="stat">
          <div className="v num">{Math.round(week.load)}</div>
          <div className="l">Carga, 7 días</div>
        </div>
      </div>
      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Sesión</th>
              <th>Tiempo</th>
              <th>Carga</th>
              <th>kcal (est.)</th>
            </tr>
          </thead>
          <tbody>
            {[...sessions].reverse().map((s) => (
              <tr key={s.id}>
                <td className="num nowrap">{dateFormat.format(s.dateMs)}</td>
                <td>
                  {s.workoutName}
                  {s.hrMeasured?.simulated && (
                    <span className="sim-tag" title="Pulso de un sensor simulado">
                      SIM.
                    </span>
                  )}
                </td>
                <td className="num">{formatMinutes(s.durationSec)}</td>
                <td className="num">{Math.round(s.load)}</td>
                <td className="num">{Math.round(s.kcalEstimated)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
