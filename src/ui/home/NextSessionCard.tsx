import { useMemo } from 'react';
import { localDate, nextPlanDay } from '../../domain/plan/plan';
import { expandWorkout } from '../../domain/workout/expand';
import { useHistoryStore } from '../../store/historyStore';
import { usePlansStore } from '../../store/plansStore';
import { useUiStore } from '../../store/uiStore';
import { dateMs, dayFmt, daySummary } from '../plan/planText';
import WorkoutProfile from '../WorkoutProfile';

/** The next session of the imported plan, ready to start. */
export default function NextSessionCard({ now }: { now: number }) {
  const plan = usePlansStore((s) => s.plans.at(-1));
  const sessions = useHistoryStore((s) => s.sessions);
  const startWorkout = useUiStore((s) => s.startWorkout);
  const setTab = useUiStore((s) => s.setTab);
  const today = localDate(now);
  const day = plan ? nextPlanDay(plan.days, sessions, today) : undefined;
  const restToday = plan?.days.some((d) => d.date === today && d.workout === null) ?? false;
  const steps = useMemo(() => (day?.workout ? expandWorkout(day.workout.blocks) : []), [day]);

  return (
    <section className="card home-next" aria-labelledby="home-next-title">
      <div className="row1">
        <h3 id="home-next-title">Próxima sesión del plan</h3>
        <button type="button" className="btn ghost" onClick={() => setTab('library')}>
          Ver el plan
        </button>
      </div>
      {!plan && (
        <p>
          No hay ningún plan importado. Se importa en <b>Sesiones → Plan del entrenador</b>.
        </p>
      )}
      {plan && !day && (
        <p>No quedan sesiones en el plan «{plan.name}». Toca importar el siguiente.</p>
      )}
      {restToday && day && day.date !== today && <p className="home-rest">Hoy toca descanso.</p>}
      {day?.workout && (
        <>
          <div className="row1">
            <div className="home-next-what">
              <span className="plan-date">
                {day.date === today ? 'Hoy' : dayFmt.format(dateMs(day.date))}
              </span>
              <b>{day.title}</b>
              <span className="plan-sum">{daySummary(day)}</span>
            </div>
            <button
              type="button"
              className={day.date === today ? 'btn primary' : 'btn'}
              onClick={() => day.workout && startWorkout(day.workout)}
            >
              Empezar
            </button>
          </div>
          <WorkoutProfile steps={steps} />
          {day.notes && day.notes !== day.title && <p>{day.notes}</p>}
        </>
      )}
    </section>
  );
}
