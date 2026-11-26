import { type KeyboardEvent, type PointerEvent, useState } from 'react';
import type { FitnessDay } from '../../domain/metrics/fitness';
import { niceTicks } from '../../recording/chart';
import { useElementWidth } from '../hooks/useElementWidth';

const HEIGHT = 190;
const M = { left: 40, right: 74, top: 10, bottom: 24 };
const dayFmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });

const SERIES = [
  { key: 'condition', label: 'Condición', color: 'var(--series-condition)' },
  { key: 'fatigue', label: 'Fatiga', color: 'var(--series-fatigue)' },
] as const;

/**
 * Condition and fatigue over the last days: two 2 px lines on one axis (same
 * unit), legend above, names at the line ends, crosshair with a readout.
 */
export default function FitnessChart({ days }: { days: FitnessDay[] }) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const n = days.length;
  const plotW = Math.max(100, width - M.left - M.right);
  const plotH = HEIGHT - M.top - M.bottom;
  const max = Math.max(10, ...days.map((d) => Math.max(d.condition, d.fatigue)));
  const yTicks = niceTicks(0, max, 4);
  const y1 = yTicks.at(-1) ?? max;
  const x = (i: number) => M.left + (i / Math.max(1, n - 1)) * plotW;
  const y = (v: number) => M.top + plotH - (v / (y1 || 1)) * plotH;
  const shown = hover ?? n - 1;
  const day = days[shown];
  const xTicks = Array.from({ length: 4 }, (_, k) => Math.round((k * (n - 1)) / 3));

  const pick = (e: PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - box.left) / box.width) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };
  const keys = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const step = e.key === 'ArrowLeft' ? -1 : 1;
    setHover(Math.min(n - 1, Math.max(0, shown + step)));
  };

  return (
    <div className="session-chart fitness-chart" ref={ref}>
      <div className="chart-head">
        <h3>Condición y fatiga · {n} días</h3>
        <ul className="legend">
          {SERIES.map((s) => (
            <li key={s.key}>
              <span className="swatch" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>
      </div>
      {day && (
        <p className="readout" aria-live="polite">
          <span className="when">{dayFmt.format(day.dayMs)}</span>
          <span>
            Condición <b>{Math.round(day.condition)}</b>
          </span>
          <span>
            Fatiga <b>{Math.round(day.fatigue)}</b>
          </span>
          <span>
            Frescura <b>{Math.round(day.freshness)}</b>
          </span>
          <span>
            Carga del día <b>{Math.round(day.load)}</b>
          </span>
        </p>
      )}
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label="Condición y fatiga por día"
        tabIndex={0}
        onKeyDown={keys}
        onBlur={() => setHover(null)}
      >
        {yTicks.map((t) => (
          <g key={t}>
            <line className="grid" x1={M.left} x2={M.left + plotW} y1={y(t)} y2={y(t)} />
            <text className="axis" x={M.left - 6} y={y(t) + 4} textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        {xTicks.map((i) => {
          const d = days[i];
          if (!d) return null;
          const anchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
          return (
            <text key={i} className="axis" x={x(i)} y={HEIGHT - 6} textAnchor={anchor}>
              {dayFmt.format(d.dayMs)}
            </text>
          );
        })}
        {SERIES.map((s) => {
          const path = days
            .map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[s.key]).toFixed(1)}`)
            .join('');
          const last = days[n - 1];
          return (
            <g key={s.key}>
              <path className="line" d={path} style={{ stroke: s.color }} />
              {last && (
                <text className="end-label" x={x(n - 1) + 8} y={y(last[s.key]) + 4}>
                  {s.label}
                </text>
              )}
            </g>
          );
        })}
        {hover !== null && day && (
          <g>
            <line className="crosshair" x1={x(shown)} x2={x(shown)} y1={M.top} y2={M.top + plotH} />
            {SERIES.map((s) => (
              <circle
                key={s.key}
                className="dot"
                cx={x(shown)}
                cy={y(day[s.key])}
                r={4}
                style={{ fill: s.color }}
              />
            ))}
          </g>
        )}
        <rect
          className="hit"
          x={M.left}
          y={M.top}
          width={plotW}
          height={plotH}
          onPointerMove={pick}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
    </div>
  );
}
