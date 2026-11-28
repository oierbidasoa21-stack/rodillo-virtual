import { donutSegments } from '../../domain/metrics/donut';
import type { SecByZone } from '../../domain/metrics/timeInZone';
import { formatClock } from '../format';
import { zoneColor } from '../zoneStyle';

const R = 42;
const CIRC = 2 * Math.PI * R;

/** Ring chart of the time in each heart rate zone, with the total in the middle. */
export default function ZoneDonut({ secByZone }: { secByZone: SecByZone }) {
  const segments = donutSegments(secByZone);
  if (!segments.length) return null;
  const total = segments.reduce((sum, s) => sum + s.sec, 0);
  const label = segments.map((s) => `${s.id} ${Math.round(s.share * 100)} %`).join(', ');
  return (
    <figure className="zone-donut">
      <svg viewBox="0 0 100 100" role="img" aria-label={`Tiempo por zona: ${label}`}>
        <circle cx="50" cy="50" r={R} className="zone-donut-track" />
        {segments.map((s) => (
          <circle
            key={s.id}
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={zoneColor(s.id)}
            strokeWidth="14"
            // Each zone is a dash of its share of the ring, starting at 12 o'clock.
            strokeDasharray={`${s.share * CIRC} ${CIRC}`}
            strokeDashoffset={-s.start * CIRC}
            transform="rotate(-90 50 50)"
          />
        ))}
        <text x="50" y="48" className="zone-donut-total num">
          {formatClock(Math.round(total))}
        </text>
        <text x="50" y="62" className="zone-donut-sub">
          en zonas
        </text>
      </svg>
      <figcaption>
        {segments.map((s) => (
          <span key={s.id}>
            <i style={{ background: zoneColor(s.id) }} /> {s.id} {Math.round(s.share * 100)} %
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
