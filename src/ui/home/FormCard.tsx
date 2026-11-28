import { useMemo } from 'react';
import { countsForFitness, fitnessCurve, freshnessLevel } from '../../domain/metrics/fitness';
import type { SessionSummary } from '../../domain/metrics/summary';
import { useUiStore } from '../../store/uiStore';
import { LEVEL_TEXT } from '../history/fitnessText';

/** Today's condition, fatigue and freshness, with a link to the full curve. */
export default function FormCard({
  sessions,
  now,
}: {
  sessions: readonly SessionSummary[];
  now: number;
}) {
  const setTab = useUiStore((s) => s.setTab);
  const today = useMemo(() => fitnessCurve(sessions, now, 1).at(-1), [sessions, now]);
  const hasData = sessions.some(countsForFitness);

  return (
    <section className="card home-form" aria-labelledby="home-form-title">
      <div className="row1">
        <h3 id="home-form-title">Forma y fatiga</h3>
        <button type="button" className="btn ghost" onClick={() => setTab('history')}>
          Ver la curva
        </button>
      </div>
      {hasData && today ? (
        <>
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
          <p className="fitness-level">{LEVEL_TEXT[freshnessLevel(today.freshness)]}</p>
        </>
      ) : (
        <p>
          Aún no hay sesiones que cuenten. Sale después de la primera (las de sensores simulados no
          cuentan).
        </p>
      )}
    </section>
  );
}
