import { useMemo } from 'react';
import { expandWorkout, totalDurationSec } from '../../domain/workout/expand';
import type { Workout } from '../../domain/workout/types';
import ConfirmButton from '../ConfirmButton';
import { formatMinutes } from '../format';
import WorkoutProfile from '../WorkoutProfile';

interface Props {
  workout: Workout;
  /** Own workouts can be edited and deleted; built-in ones are duplicated. */
  isCustom: boolean;
  onStart: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}

export default function WorkoutCard({ workout, isCustom, onStart, onEdit, onDelete }: Props) {
  const steps = useMemo(() => expandWorkout(workout.blocks), [workout.blocks]);
  return (
    <article className="card">
      <div className="row1">
        <h3>{workout.name}</h3>
        <span className="dur num">{formatMinutes(totalDurationSec(steps))}</span>
      </div>
      {workout.description && <p>{workout.description}</p>}
      <WorkoutProfile steps={steps} />
      <div className="actions">
        <button type="button" className="btn primary" onClick={onStart}>
          Empezar
        </button>
        <button type="button" className="btn" onClick={onEdit}>
          {isCustom ? 'Editar' : 'Duplicar y editar'}
        </button>
        {isCustom && onDelete && <ConfirmButton label="Borrar" onConfirm={onDelete} />}
      </div>
    </article>
  );
}
