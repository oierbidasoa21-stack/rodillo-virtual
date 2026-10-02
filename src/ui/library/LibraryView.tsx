import { BUILTIN_WORKOUTS } from '../../domain/workout/library';
import { makeBlock } from '../../domain/workout/types';
import { useUiStore } from '../../store/uiStore';
import { useWorkoutsStore } from '../../store/workoutsStore';
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

  // The player arrives in the next block of phase 1.
  const start = () => showToast('El player llega en el siguiente bloque');

  return (
    <>
      <div className="sectionhead">
        <h2>Mis sesiones</h2>
        <button type="button" className="btn" onClick={() => openEditor(NEW_WORKOUT)}>
          Nueva sesión
        </button>
      </div>
      <div className="list">
        {custom.length ? (
          custom.map((w) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              isCustom
              onStart={start}
              onEdit={() => openEditor(w)}
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
        <h2>Biblioteca</h2>
      </div>
      <div className="list">
        {BUILTIN_WORKOUTS.map((w) => (
          <WorkoutCard
            key={w.id}
            workout={w}
            isCustom={false}
            onStart={start}
            onEdit={() => openEditor({ ...w, id: null, name: `${w.name} (mía)` })}
          />
        ))}
      </div>
    </>
  );
}
