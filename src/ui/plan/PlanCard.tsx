import { useRef, useState } from 'react';
import { fitnessCurve } from '../../domain/metrics/fitness';
import { AGENT_INSTRUCTIONS } from '../../domain/plan/instructions';
import { type PlanDay, dayDone, localDate, parsePlan } from '../../domain/plan/plan';
import { coachReport } from '../../domain/plan/report';
import { expandWorkout, totalDurationSec } from '../../domain/workout/expand';
import type { BlockTarget } from '../../domain/workout/types';
import { useHistoryStore } from '../../store/historyStore';
import { usePlansStore } from '../../store/plansStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';
import ConfirmButton from '../ConfirmButton';
import { downloadText } from '../download';
import { formatMinutes } from '../format';

const dayFmt = new Intl.DateTimeFormat('es-ES', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

/** Local midnight of a YYYY-MM-DD date. */
const dateMs = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getTime();
};

/** "Z4", "90 % FTP" or "240 W". */
const targetText = (t: BlockTarget) =>
  t.type === 'hr' ? t.zoneId : t.type === 'power' ? `${t.pctFtp} % FTP` : `${t.watts} W`;

/** "4×4′ Z4 · 3′ Z1" style summary of the main work of a day. */
function daySummary(day: PlanDay): string {
  if (!day.workout) return 'Descanso';
  const total = totalDurationSec(expandWorkout(day.workout.blocks));
  const parts = day.workout.blocks.map((b) => {
    if (b.type === 'repeat') {
      const first = b.items[0];
      return first
        ? `${b.times}×${formatMinutes(first.durationSec)} ${targetText(first.target)}`
        : '';
    }
    return `${formatMinutes(b.durationSec)} ${targetText(b.target)}`;
  });
  // A single block already says it all: "1 h 15′ Z2".
  if (parts.length === 1) return parts[0] ?? formatMinutes(total);
  return `${formatMinutes(total)} · ${parts.filter(Boolean).join(' · ')}`;
}

/**
 * The bridge with the coaching agent: copy a report of recent training for it,
 * import the weekly plan it writes, and start each day's session from here.
 */
export default function PlanCard() {
  const plans = usePlansStore((s) => s.plans);
  const savePlan = usePlansStore((s) => s.save);
  const removePlan = usePlansStore((s) => s.remove);
  const sessions = useHistoryStore((s) => s.sessions);
  const startWorkout = useUiStore((s) => s.startWorkout);
  const showToast = useUiStore((s) => s.showToast);
  const [importing, setImporting] = useState(false);
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const plan = plans.at(-1);
  const [today] = useState(() => localDate(Date.now()));

  const report = () => {
    const now = Date.now();
    return coachReport({
      sessions,
      fitness: fitnessCurve(sessions, now, 90),
      zones: useSettingsStore.getState().settings.athlete.hrZonesPer10s,
      nowMs: now,
    });
  };
  const copyReport = async () => {
    const md = report();
    try {
      await navigator.clipboard.writeText(md);
      showToast('Informe copiado: pégaselo a tu agente');
    } catch {
      downloadText(`informe-entrenamiento-${localDate(Date.now())}.md`, md, 'text/markdown');
      showToast('No se pudo copiar: informe descargado');
    }
  };
  const doImport = async (raw: string) => {
    const r = parsePlan(raw);
    if (!r.plan) {
      setErrors(r.errors);
      return;
    }
    const now = Date.now();
    await savePlan({ ...r.plan, id: crypto.randomUUID(), importedAtMs: now });
    setErrors([]);
    setText('');
    setImporting(false);
    showToast(`Plan importado: ${r.plan.days.length} días`);
  };

  return (
    <section className="card plan-card" aria-labelledby="plan-title">
      <div className="sectionhead">
        <h3 id="plan-title">Plan del entrenador</h3>
        <div className="head-actions">
          <button type="button" className="btn" onClick={() => void copyReport()}>
            Copiar informe
          </button>
          <button
            type="button"
            className="btn"
            onClick={() =>
              downloadText('instrucciones-rodillo-virtual.md', AGENT_INSTRUCTIONS, 'text/markdown')
            }
          >
            Instrucciones para el agente
          </button>
          <button type="button" className="btn" onClick={() => setImporting((v) => !v)}>
            Importar plan
          </button>
        </div>
      </div>
      {!plan && !importing && (
        <p className="note">
          Dale a tu agente las <b>instrucciones</b> una vez. Cada semana, cópiale el <b>informe</b>{' '}
          (tus zonas, forma y sesiones de las últimas 4 semanas), pídele el plan y pégalo aquí con{' '}
          <b>Importar plan</b>.
        </p>
      )}
      {importing && (
        <div className="plan-import">
          <label htmlFor="plan-text">Pega la respuesta del agente (o el JSON del plan)</label>
          <textarea
            id="plan-text"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='{ "formato": "rodillo-virtual/plan@1", "dias": [ … ] }'
          />
          <div className="head-actions">
            <button
              type="button"
              className="btn primary"
              disabled={!text.trim()}
              onClick={() => void doImport(text)}
            >
              Importar
            </button>
            <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
              Desde archivo…
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".json,.md,.txt,application/json,text/plain,text/markdown"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) void file.text().then(doImport);
              }}
            />
          </div>
        </div>
      )}
      {errors.length > 0 && (
        <div className="msg error" role="alert">
          <p style={{ margin: '0 0 4px' }}>No se ha importado el plan:</p>
          <ul>
            {errors.slice(0, 8).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {plan && (
        <>
          <p className="plan-name">{plan.name}</p>
          <ol className="plan-days">
            {plan.days.map((d) => {
              const done = dayDone(d, sessions);
              const isToday = d.date === today;
              const past = d.date < today;
              return (
                <li key={d.date} className={isToday ? 'today' : past ? 'past' : ''}>
                  <span className="plan-date">
                    {isToday ? 'Hoy' : dayFmt.format(dateMs(d.date))}
                  </span>
                  <span className="plan-what">
                    <b>{d.title}</b>
                    {d.workout && <span className="plan-sum">{daySummary(d)}</span>}
                    {d.notes && d.notes !== d.title && (
                      <span className="plan-notes">{d.notes}</span>
                    )}
                  </span>
                  <span className="plan-status">
                    {done ? (
                      <span className="done">✓ Hecha</span>
                    ) : d.workout ? (
                      <button
                        type="button"
                        className={isToday ? 'btn primary' : 'btn'}
                        onClick={() => d.workout && startWorkout(d.workout)}
                      >
                        Empezar
                      </button>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ol>
          <ConfirmButton label="Borrar plan" onConfirm={() => void removePlan(plan.id)} />
        </>
      )}
    </section>
  );
}
