import { useRef, useState } from 'react';
import { BUILTIN_WORKOUTS } from '../../domain/workout/library';
import { type Workout, makeBlock } from '../../domain/workout/types';
import { ZwoError, buildZwo, parseZwo, zwoFileName } from '../../domain/workout/zwo';
import { downloadText } from '../download';
import { useUiStore } from '../../store/uiStore';
import { useWorkoutsStore } from '../../store/workoutsStore';
import RampTestCard from '../ramp/RampTestCard';
import WorkoutCard from './WorkoutCard';

const NEW_WORKOUT = {
  id: null,
  name: '',
  description: '',
  blocks: [makeBlock(600, 'L1', 'warm'), makeBlock(1200, 'L2'), makeBlock(300, 'L1', 'cool')],
};

export default function LibraryView() {
  const custom = useWorkoutsStore((s) => s.custom);
  const remove = useWorkoutsStore((s) => s.remove);
  const openEditor = useUiStore((s) => s.openEditor);
  const showToast = useUiStore((s) => s.showToast);

  const startWorkout = useUiStore((s) => s.startWorkout);
  const save = useWorkoutsStore((s) => s.save);
  const fileInput = useRef<HTMLInputElement>(null);
  // Result of the last .zwo import: an error, or what changed on the way in.
  const [importMsg, setImportMsg] = useState<{ error: boolean; lines: string[] } | null>(null);

  const importZwo = async (file: File) => {
    try {
      const { workout, warnings } = parseZwo(await file.text());
      await save({ ...workout, id: crypto.randomUUID() });
      setImportMsg(warnings.length ? { error: false, lines: warnings } : null);
      showToast(`Sesión importada: ${workout.name}`);
    } catch (e) {
      const text = e instanceof ZwoError ? e.message : 'No se ha podido leer el archivo.';
      setImportMsg({ error: true, lines: [text] });
    }
  };

  const exportZwo = (w: Workout) => {
    const { xml, warnings } = buildZwo(w);
    downloadText(zwoFileName(w.name), xml, 'application/xml');
    showToast(warnings[0] ?? 'Sesión exportada');
  };

  return (
    <>
      <div className="sectionhead">
        <h2>Mis sesiones</h2>
        <div className="head-actions">
          <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
            Importar .zwo
          </button>
          <button type="button" className="btn" onClick={() => openEditor(NEW_WORKOUT)}>
            Nueva sesión
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".zwo,application/xml,text/xml"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void importZwo(file);
          }}
        />
      </div>
      {importMsg && (
        <div className={importMsg.error ? 'msg error' : 'msg'} role="status">
          <p style={{ margin: '0 0 4px' }}>
            {importMsg.error ? 'No se ha importado la sesión:' : 'Sesión importada con cambios:'}
          </p>
          <ul>
            {importMsg.lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="list">
        {custom.length ? (
          custom.map((w) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              isCustom
              onStart={() => startWorkout(w)}
              onEdit={() => openEditor(w)}
              onExport={() => exportZwo(w)}
              onDelete={() => {
                void remove(w.id);
                showToast('Sesión borrada');
              }}
            />
          ))
        ) : (
          <p className="note">
            Aún no tienes sesiones propias. Crea una nueva o duplica una de la biblioteca para
            ajustarla.
          </p>
        )}
      </div>

      <div className="sectionhead">
        <h2>Pruebas</h2>
      </div>
      <div className="list">
        <RampTestCard />
      </div>

      <div className="sectionhead">
        <h2>Biblioteca</h2>
      </div>
      <div className="list">
        {BUILTIN_WORKOUTS.map((w) => (
          <WorkoutCard
            key={w.id}
            workout={w}
            isCustom={false}
            onStart={() => startWorkout(w)}
            onEdit={() => openEditor({ ...w, id: null, name: `${w.name} (mía)` })}
            onExport={() => exportZwo(w)}
          />
        ))}
      </div>
    </>
  );
}
