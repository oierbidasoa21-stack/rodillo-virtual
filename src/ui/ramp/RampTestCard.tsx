import { useMemo, useState } from 'react';
import { curveFor } from '../../domain/trainer/curves';
import { expandWorkout } from '../../domain/workout/expand';
import { buildRampTest } from '../../domain/workout/ramp';
import { useSensorsStore } from '../../store/sensorsStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';
import WorkoutProfile from '../WorkoutProfile';

/** Library card that starts the ramp test once a trainer curve and a speed sensor are ready. */
export default function RampTestCard() {
  const trainer = useSettingsStore((s) => s.settings.trainer);
  const ftp = useSettingsStore((s) => s.settings.athlete.ftp);
  const cscStatus = useSensorsStore((s) => s.csc.status);
  const startWorkout = useUiStore((s) => s.startWorkout);
  const setTab = useUiStore((s) => s.setTab);
  const [missing, setMissing] = useState<string[]>([]);
  const ramp = useMemo(() => buildRampTest(), []);
  const steps = useMemo(() => expandWorkout(ramp.blocks).slice(0, 14), [ramp]);

  const start = () => {
    const problems: string[] = [];
    if (!curveFor(trainer)) problems.push('Elige tu rodillo en Ajustes → Rodillo y potencia.');
    if (cscStatus !== 'connected' && cscStatus !== 'reconnecting') {
      problems.push('Conecta el sensor de velocidad en Sensores.');
    }
    setMissing(problems);
    if (!problems.length) startWorkout(ramp, 'ramp');
  };

  return (
    <article className="card">
      <div className="row1">
        <h3>Ramp test</h3>
        <span className="dur num">{ftp ? `FTP ${ftp.watts} W` : 'Sin FTP'}</span>
      </div>
      <p>
        5′ suaves y después +20 W cada minuto desde 100 W, hasta que no puedas mantenerlo. Tu FTP
        estimado es el 75 % de tu mejor minuto. Dura unos 15–25 minutos.
      </p>
      <WorkoutProfile steps={steps} />
      {missing.length > 0 && (
        <div className="msg error" role="alert">
          <p style={{ margin: '0 0 4px' }}>Para hacer el ramp test hace falta potencia:</p>
          <ul>
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="actions">
        <button type="button" className="btn primary" onClick={start}>
          Hacer ramp test
        </button>
        {missing.length > 0 && (
          <>
            <button type="button" className="btn ghost" onClick={() => setTab('sensors')}>
              Ir a Sensores
            </button>
            <button type="button" className="btn ghost" onClick={() => setTab('settings')}>
              Ir a Ajustes
            </button>
          </>
        )}
      </div>
    </article>
  );
}
