import { useMemo } from 'react';
import { dayStart, weekDays, weeklyTotals } from '../../domain/metrics/fitness';
import type { SessionSummary } from '../../domain/metrics/summary';
import { formatMinutes } from '../format';

const DAY_LETTER = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** This week, day by day, with its totals next to last week's. */
export default function WeekCard({
  sessions,
  now,
}: {
  sessions: readonly SessionSummary[];
  now: number;
}) {
  const days = useMemo(() => weekDays(sessions, now), [sessions, now]);
  const [last, current] = useMemo(() => weeklyTotals(sessions, now, 2), [sessions, now]);
  const today = dayStart(now);
  const top = Math.max(1, ...days.map((d) => d.load));

  return (
    <section className="card home-week" aria-labelledby="home-week-title">
      <h3 id="home-week-title">Esta semana</h3>
      <ol className="week-days">
        {days.map((d, i) => (
          <li
            key={d.dayMs}
            className={d.dayMs === today ? 'today' : d.dayMs > today ? 'future' : ''}
            title={
              d.sessions
                ? `${d.sessions} ${d.sessions === 1 ? 'sesión' : 'sesiones'} · ${formatMinutes(d.durationSec)} · carga ${Math.round(d.load)}`
                : 'Sin sesiones'
            }
          >
            <span className="week-bar">
              <i style={{ height: `${(d.load / top) * 100}%` }} />
            </span>
            <span className="week-letter">{DAY_LETTER[i]}</span>
          </li>
        ))}
      </ol>
      <div className="fitness-tiles">
        <div>
          <span className="label">Sesiones</span>
          <b>{current?.sessions ?? 0}</b>
          <span className="hint">la pasada, {last?.sessions ?? 0}</span>
        </div>
        <div>
          <span className="label">Tiempo</span>
          <b>{formatMinutes(current?.durationSec ?? 0)}</b>
          <span className="hint">la pasada, {formatMinutes(last?.durationSec ?? 0)}</span>
        </div>
        <div>
          <span className="label">Carga</span>
          <b>{Math.round(current?.load ?? 0)}</b>
          <span className="hint">la pasada, {Math.round(last?.load ?? 0)}</span>
        </div>
      </div>
    </section>
  );
}
