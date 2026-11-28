import { useMemo } from 'react';
import { fitnessCurve, freshnessLevel, weeklyTotals } from '../../domain/metrics/fitness';
import type { SessionSummary } from '../../domain/metrics/summary';
import FitnessChart from './FitnessChart';
import { LEVEL_TEXT } from './fitnessText';
import WeeklyLoadChart from './WeeklyLoadChart';

/** Condition, fatigue and freshness from the history, with the curve and weekly load. */
export default function FitnessPanel({
  sessions,
  now,
}: {
  sessions: readonly SessionSummary[];
  now: number;
}) {
  const days = useMemo(() => fitnessCurve(sessions, now, 90), [sessions, now]);
  const weeks = useMemo(() => weeklyTotals(sessions, now, 12), [sessions, now]);
  const today = days.at(-1);
  if (!today) return null;
  const level = freshnessLevel(today.freshness);

  return (
    <section className="card fitness-panel" aria-labelledby="fitness-title">
      <h3 id="fitness-title">Forma</h3>
      <div className="fitness-tiles">
        <div>
          <span className="label">Condición</span>
          <b>{Math.round(today.condition)}</b>
          <span className="hint">media de 42 días</span>
        </div>
        <div>
          <span className="label">Fatiga</span>
          <b>{Math.round(today.fatigue)}</b>
          <span className="hint">media de 7 días</span>
        </div>
        <div>
          <span className="label">Frescura</span>
          <b>{Math.round(today.freshness)}</b>
          <span className="hint">condición − fatiga</span>
        </div>
      </div>
      <p className="fitness-level">{LEVEL_TEXT[level]}</p>
      <FitnessChart days={days} />
      <WeeklyLoadChart weeks={weeks} />
      <p className="note">
        Calculado con la carga de cada sesión (minutos en zona de pulso × peso de la zona; sin
        pulsómetro, la de los bloques planificados). Las sesiones con sensores simulados no cuentan.
        Es orientativo: compáralo con tus sensaciones.
      </p>
    </section>
  );
}
