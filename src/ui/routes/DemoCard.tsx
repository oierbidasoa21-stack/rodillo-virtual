import { useState } from 'react';
import type { Route } from '../../domain/route/route';
import { useUiStore } from '../../store/uiStore';

/** Shows the 3D world without sensors: the rider goes by itself at a simulated power. */
export default function DemoCard({ routes }: { routes: Route[] }) {
  const startDemo = useUiStore((s) => s.startDemo);
  // The climb shows the hills best.
  const [routeId, setRouteId] = useState(
    () => (routes.find((r) => r.name.startsWith('Puerto')) ?? routes[0])?.id ?? '',
  );
  const route = routes.find((r) => r.id === routeId);

  return (
    <article className="card demo-card">
      <div className="row1">
        <h3>Demo 3D</h3>
        <span className="tag">Sin sensores</span>
      </div>
      <p>
        Mira cómo se ve el mundo 3D: el ciclista recorre la ruta solo, a 200 W <b>simulados</b> con
        la física de siempre. Va marcada como DEMO y no se graba ni se guarda nada.
      </p>
      <div className="actions">
        <select
          aria-label="Ruta de la demo"
          value={routeId}
          onChange={(e) => setRouteId(e.target.value)}
        >
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn primary"
          disabled={!route}
          onClick={() => route && startDemo(route)}
        >
          Ver demo 3D
        </button>
      </div>
    </article>
  );
}
