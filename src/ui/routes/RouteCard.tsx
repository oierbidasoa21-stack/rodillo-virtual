import { useState } from 'react';
import type { Route } from '../../domain/route/route';
import type { Workout } from '../../domain/workout/types';
import ConfirmButton from '../ConfirmButton';
import ElevationProfile from '../ride/ElevationProfile';
import { RIDE_MODE_LABEL, type RideReadiness } from '../ride/rideMode';
import { formatKm } from '../ride/rideFormat';

interface Props {
  route: Route;
  readiness: RideReadiness;
  /** Sessions that can be ridden on the route. */
  workouts: readonly Workout[];
  onRide: () => void;
  onRideWorkout: (workoutId: string) => void;
  onDelete?: () => void;
}

const pct = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

export default function RouteCard({
  route,
  readiness,
  workouts,
  onRide,
  onRideWorkout,
  onDelete,
}: Props) {
  const [missing, setMissing] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);
  const [workoutId, setWorkoutId] = useState(workouts[0]?.id ?? '');
  const guard = (go: () => void) => {
    if (readiness.ok) go();
    else setMissing(readiness.missing);
  };
  return (
    <article className="card">
      <div className="row1">
        <h3>{route.name}</h3>
        <span className="tag">{route.source === 'builtin' ? 'Ejemplo' : 'Importada'}</span>
      </div>
      {route.description && <p>{route.description}</p>}
      <p className="num">
        {formatKm(route.distanceM)} · +{Math.round(route.ascentM)} m · máx.{' '}
        {pct.format(route.maxGrade * 100)} %
      </p>
      <ElevationProfile route={route} height={60} />
      {missing.length > 0 && (
        <p className="msg error" role="alert">
          {missing.join(' ')}
        </p>
      )}
      <div className="actions">
        <button type="button" className="btn primary" onClick={() => guard(onRide)}>
          Rodar
        </button>
        <button type="button" className="btn" onClick={() => setPicking((v) => !v)}>
          Con una sesión…
        </button>
        {onDelete && <ConfirmButton label="Borrar" onConfirm={onDelete} />}
        {readiness.ok && <span className="note">{RIDE_MODE_LABEL[readiness.mode]}</span>}
      </div>
      {picking && (
        <div className="field">
          <label htmlFor={`ws-${route.id}`}>Sesión</label>
          <select
            id={`ws-${route.id}`}
            value={workoutId}
            onChange={(e) => setWorkoutId(e.target.value)}
          >
            {workouts.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn primary"
            disabled={!workoutId}
            onClick={() => guard(() => onRideWorkout(workoutId))}
          >
            Empezar sesión en esta ruta
          </button>
          <span className="note">La ruta da vueltas hasta que acabe la sesión.</span>
        </div>
      )}
    </article>
  );
}
