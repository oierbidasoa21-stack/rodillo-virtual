import { useMemo, useRef, useState } from 'react';
import { builtinRoutes } from '../../domain/route/examples';
import { parseGpx } from '../../domain/route/gpx';
import { buildRoute } from '../../domain/route/route';
import { curveFor } from '../../domain/trainer/curves';
import { BUILTIN_WORKOUTS } from '../../domain/workout/library';
import { useRoutesStore } from '../../store/routesStore';
import { useSensorsStore } from '../../store/sensorsStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';
import { useWorkoutsStore } from '../../store/workoutsStore';
import { RIDE_MODE_HINT, rideReadiness } from '../ride/rideMode';
import RouteCard from './RouteCard';

export default function RoutesView() {
  const imported = useRoutesStore((s) => s.imported);
  const save = useRoutesStore((s) => s.save);
  const remove = useRoutesStore((s) => s.remove);
  const trainer = useSettingsStore((s) => s.settings.trainer);
  const cscStatus = useSensorsStore((s) => s.csc.status);
  const startRide = useUiStore((s) => s.startRide);
  const startWorkout = useUiStore((s) => s.startWorkout);
  const custom = useWorkoutsStore((s) => s.custom);
  const workouts = useMemo(() => [...custom, ...BUILTIN_WORKOUTS], [custom]);
  const showToast = useUiStore((s) => s.showToast);
  const fileInput = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const examples = useMemo(() => builtinRoutes(), []);
  const readiness = rideReadiness(curveFor(trainer) !== null, cscStatus);

  const importGpx = async (file: File) => {
    const parsed = parseGpx(await file.text());
    if (!parsed.ok) return setErrors(parsed.errors);
    const name = parsed.value.name ?? file.name.replace(/\.gpx$/i, '');
    const route = buildRoute(parsed.value.points, {
      id: `gpx-${crypto.randomUUID()}`,
      name,
      source: 'gpx',
    });
    if (!route) return setErrors(['Todos los puntos del GPX están en el mismo sitio.']);
    setErrors([]);
    await save(route);
    showToast(`Ruta importada: ${name}`);
  };

  const ride = (routeId: string) => {
    const route = [...examples, ...imported].find((r) => r.id === routeId);
    if (route && readiness.ok) startRide(route, readiness.mode);
  };

  const rideWorkout = (routeId: string, workoutId: string) => {
    const route = [...examples, ...imported].find((r) => r.id === routeId);
    const workout = workouts.find((w) => w.id === workoutId);
    if (route && workout && readiness.ok) {
      startWorkout(workout, 'normal', { route, mode: readiness.mode });
    }
  };

  return (
    <>
      <div className="sectionhead">
        <h2>Mis rutas</h2>
        <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
          Importar GPX
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".gpx,application/gpx+xml"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void importGpx(file);
          }}
        />
      </div>
      {errors.length > 0 && (
        <div className="msg error" role="alert">
          <p style={{ margin: '0 0 4px' }}>No se ha importado la ruta:</p>
          <ul>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="list">
        {imported.length ? (
          imported.map((r) => (
            <RouteCard
              key={r.id}
              route={r}
              readiness={readiness}
              workouts={workouts}
              onRide={() => ride(r.id)}
              onRideWorkout={(w) => rideWorkout(r.id, w)}
              onDelete={() => {
                void remove(r.id);
                showToast('Ruta borrada');
              }}
            />
          ))
        ) : (
          <p className="note">
            Importa un GPX de una salida tuya o de una ruta que quieras hacer. Se guarda solo en
            este navegador.
          </p>
        )}
      </div>

      <div className="sectionhead">
        <h2>Rutas de ejemplo</h2>
      </div>
      {readiness.ok && <p className="note">{RIDE_MODE_HINT[readiness.mode]}</p>}
      <div className="list">
        {examples.map((r) => (
          <RouteCard
            key={r.id}
            route={r}
            readiness={readiness}
            workouts={workouts}
            onRide={() => ride(r.id)}
            onRideWorkout={(w) => rideWorkout(r.id, w)}
          />
        ))}
      </div>
    </>
  );
}
