import { useMemo, useState } from 'react';
import {
  appendItem,
  appendToRepeat,
  moveItem,
  removeItem,
  setRepeatTimes,
  updateBlock,
} from '../../domain/workout/edit';
import { expandWorkout, totalDurationSec } from '../../domain/workout/expand';
import { type Workout, type WorkoutItem, makeBlock, makeRepeat } from '../../domain/workout/types';
import { validateWorkout } from '../../domain/workout/validate';
import { useUiStore } from '../../store/uiStore';
import { useWorkoutsStore } from '../../store/workoutsStore';
import { formatMinutes } from '../format';
import WorkoutProfile from '../WorkoutProfile';
import BlockRow from './BlockRow';
import RepeatGroup from './RepeatGroup';

type Draft = Omit<Workout, 'id'> & { id: string | null };

/** Full-screen editor. Works on a local draft; nothing is saved until "Guardar". */
export default function EditorSheet({ initial }: { initial: Draft }) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const closeEditor = useUiStore((s) => s.closeEditor);
  const setTab = useUiStore((s) => s.setTab);
  const showToast = useUiStore((s) => s.showToast);
  const save = useWorkoutsStore((s) => s.save);

  const steps = useMemo(() => expandWorkout(draft.blocks), [draft.blocks]);
  const setBlocks = (fn: (blocks: WorkoutItem[]) => WorkoutItem[]) =>
    setDraft((d) => ({ ...d, blocks: fn(d.blocks) }));

  const onSave = () => {
    const problems = validateWorkout(draft);
    setErrors(problems);
    if (problems.length) return;
    void save({ ...draft, name: draft.name.trim(), id: draft.id ?? crypto.randomUUID() });
    closeEditor();
    setTab('library');
    showToast('Sesión guardada');
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="ed-title">
      <div className="sheet">
        <div className="sheet-top">
          <h2 id="ed-title">{initial.id ? 'Editar sesión' : 'Nueva sesión'}</h2>
          <button type="button" className="btn ghost" onClick={closeEditor}>
            Cancelar
          </button>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <div className="field">
            <label htmlFor="ed-name">Nombre</label>
            <input
              id="ed-name"
              type="text"
              className="grow"
              placeholder="Por ejemplo, Umbral 4×8′"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="ed-desc">Descripción</label>
            <input
              id="ed-desc"
              type="text"
              className="grow"
              placeholder="Opcional"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>
          <div className="row1">
            <span className="tag">Perfil</span>
            <span className="dur num">{formatMinutes(totalDurationSec(steps))}</span>
          </div>
          <WorkoutProfile steps={steps} />
        </div>

        <div className="list" style={{ marginTop: 12 }}>
          {draft.blocks.map((item, i) =>
            item.type === 'repeat' ? (
              <RepeatGroup
                key={i}
                repeat={item}
                index={i}
                onTimes={(t) => setBlocks((b) => setRepeatTimes(b, i, t))}
                onMove={(d) => setBlocks((b) => moveItem(b, [i], d))}
                onRemove={() => setBlocks((b) => removeItem(b, [i]))}
                onAddBlock={() =>
                  setBlocks((b) => appendToRepeat(b, i, makeBlock(120, 'L1', 'rec')))
                }
                onBlockChange={(j, patch) => setBlocks((b) => updateBlock(b, [i, j], patch))}
                onBlockMove={(j, d) => setBlocks((b) => moveItem(b, [i, j], d))}
                onBlockRemove={(j) => setBlocks((b) => removeItem(b, [i, j]))}
              />
            ) : (
              <BlockRow
                key={i}
                block={item}
                idPrefix={`b-${i}`}
                onChange={(patch) => setBlocks((b) => updateBlock(b, [i], patch))}
                onMove={(d) => setBlocks((b) => moveItem(b, [i], d))}
                onRemove={() => setBlocks((b) => removeItem(b, [i]))}
              />
            ),
          )}
        </div>

        <div className="actions" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="btn"
            onClick={() => setBlocks((b) => appendItem(b, makeBlock(300, 'L2')))}
          >
            Añadir bloque
          </button>
          <button
            type="button"
            className="btn"
            onClick={() =>
              setBlocks((b) =>
                appendItem(
                  b,
                  makeRepeat(3, [makeBlock(240, 'UA', 'work'), makeBlock(120, 'L1', 'rec')]),
                ),
              )
            }
          >
            Añadir repetición
          </button>
        </div>

        <div className="actions" style={{ marginTop: 20 }}>
          <button type="button" className="btn primary" onClick={onSave}>
            Guardar sesión
          </button>
        </div>
        {errors.length > 0 && (
          <div className="msg error" role="alert" style={{ marginTop: 10 }}>
            {errors.map((e) => (
              <p key={e} style={{ margin: 0 }}>
                {e}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
