import { useMemo } from 'react';
import type { Route } from '../../domain/route/route';

interface Props {
  route: Route;
  /** Current position, if riding. */
  at?: { lat: number; lon: number } | null;
  height?: number;
}

const MAX_DRAWN = 800;
const PAD = 12;
const SIZE = 300;

/** The route's shape with a dot for the rider. No map tiles: works offline. */
export default function MiniMap({ route, at = null, height = 180 }: Props) {
  const geo = useMemo(() => {
    const step = Math.max(1, Math.ceil(route.points.length / MAX_DRAWN));
    const pts = route.points.filter((_, i) => i % step === 0 || i === route.points.length - 1);
    const meanLat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
    const k = Math.cos((meanLat * Math.PI) / 180);
    // Equirectangular projection: fine at the scale of a ride.
    const xy = (p: { lat: number; lon: number }) => ({ x: p.lon * k, y: -p.lat });
    const proj = pts.map(xy);
    const xs = proj.map((p) => p.x);
    const ys = proj.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const span = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY) || 1;
    const scale = (SIZE - 2 * PAD) / span;
    const toView = (p: { lat: number; lon: number }) => {
      const q = xy(p);
      return { x: PAD + (q.x - minX) * scale, y: PAD + (q.y - minY) * scale };
    };
    const line = pts.map((p) => {
      const v = toView(p);
      return `${v.x.toFixed(1)},${v.y.toFixed(1)}`;
    });
    const first = pts[0];
    return { line: line.join(' '), start: first ? toView(first) : null, toView };
  }, [route]);

  const dot = at ? geo.toView(at) : null;
  return (
    <svg
      className="minimap"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ height }}
      role="img"
      aria-label={`Recorrido de ${route.name}`}
    >
      <polyline points={geo.line} className="minimap-route" fill="none" />
      {geo.start && (
        <rect
          x={geo.start.x - 5}
          y={geo.start.y - 5}
          width={10}
          height={10}
          className="minimap-start"
        />
      )}
      {dot && <circle cx={dot.x} cy={dot.y} r={8} className="minimap-dot" />}
    </svg>
  );
}
