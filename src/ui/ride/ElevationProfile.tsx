import { useMemo } from 'react';
import { type Route, segmentGrade } from '../../domain/route/route';
import { gradeColor } from './rideFormat';

interface Props {
  route: Route;
  /** Rider position in metres into the route; omitted on cards. */
  positionM?: number | null;
  /** Stretch ahead of the rider drawn bold. */
  aheadM?: number;
  height?: number;
}

const W = 1000;
const H = 200;
/** At most this many points are drawn; enough for a smooth line at any width. */
const MAX_DRAWN = 500;

/**
 * Elevation along the route, coloured by gradient, with the rider's position
 * and the next stretch highlighted.
 */
export default function ElevationProfile({
  route,
  positionM = null,
  aheadM = 500,
  height = 120,
}: Props) {
  const geo = useMemo(() => {
    const step = Math.max(1, Math.ceil(route.points.length / MAX_DRAWN));
    const pts = route.points
      .map((p, idx) => ({ ...p, idx }))
      .filter((p) => p.idx % step === 0 || p.idx === route.points.length - 1);
    const eles = pts.map((p) => p.ele);
    const min = Math.min(...eles);
    const max = Math.max(...eles);
    // At least 50 m of vertical range, so a flat route looks flat.
    const span = Math.max(50, max - min);
    const x = (d: number) => (d / route.distanceM) * W;
    const y = (e: number) => H - 8 - ((e - min) / span) * (H - 16);

    const area =
      `M0,${H} ` +
      pts.map((p) => `L${x(p.distanceM).toFixed(1)},${y(p.ele).toFixed(1)}`).join(' ') +
      ` L${W},${H} Z`;

    // Runs of the same colour, each drawn as one polyline.
    const runs: { color: string; points: string }[] = [];
    pts.forEach((p, i) => {
      const next = pts[i + 1];
      if (!next) return;
      const color = gradeColor(segmentGrade(route.points, p.idx));
      const a = `${x(p.distanceM).toFixed(1)},${y(p.ele).toFixed(1)}`;
      const b = `${x(next.distanceM).toFixed(1)},${y(next.ele).toFixed(1)}`;
      const last = runs[runs.length - 1];
      if (last && last.color === color) last.points += ` ${b}`;
      else runs.push({ color, points: `${a} ${b}` });
    });
    return { pts, x, y, area, runs };
  }, [route]);

  let marker: { x: number; y: number } | null = null;
  let ahead: string | null = null;
  if (positionM !== null) {
    const d = Math.min(route.distanceM, Math.max(0, positionM));
    const near = geo.pts.reduce((best, p) =>
      Math.abs(p.distanceM - d) < Math.abs(best.distanceM - d) ? p : best,
    );
    marker = { x: geo.x(d), y: geo.y(near.ele) };
    const end = d + aheadM;
    const stretch = geo.pts.filter((p) => p.distanceM >= d && p.distanceM <= end);
    if (stretch.length > 1) {
      ahead = stretch
        .map((p) => `${geo.x(p.distanceM).toFixed(1)},${geo.y(p.ele).toFixed(1)}`)
        .join(' ');
    }
  }

  return (
    <div className="elevation-wrap" style={{ height }}>
      <svg
        className="elevation"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Perfil de ${route.name}`}
      >
        <path d={geo.area} className="elevation-area" />
        {geo.runs.map((r, i) => (
          <polyline
            key={i}
            points={r.points}
            fill="none"
            stroke={r.color}
            strokeWidth={3}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {ahead && (
          <polyline
            points={ahead}
            fill="none"
            className="elevation-ahead"
            strokeWidth={7}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {marker && (
          <>
            <line
              x1={marker.x}
              x2={marker.x}
              y1={0}
              y2={H}
              className="elevation-cursor"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}
      </svg>
      {marker && (
        // An HTML dot: inside the stretched SVG a circle would become an ellipse.
        <span
          className="elevation-dot"
          style={{ left: `${(marker.x / W) * 100}%`, top: `${(marker.y / H) * 100}%` }}
        />
      )}
    </div>
  );
}
