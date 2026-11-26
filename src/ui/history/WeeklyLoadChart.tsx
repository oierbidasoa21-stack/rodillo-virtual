import { useState } from 'react';
import type { WeekTotals } from '../../domain/metrics/fitness';
import { niceTicks } from '../../recording/chart';
import { formatMinutes } from '../format';
import { useElementWidth } from '../hooks/useElementWidth';

const HEIGHT = 150;
const M = { left: 40, right: 8, top: 10, bottom: 24 };
const weekFmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });

/** Load per week: thin bars with rounded tops and a 2 px gap, hover for the details. */
export default function WeeklyLoadChart({ weeks }: { weeks: WeekTotals[] }) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const n = weeks.length;
  const plotW = Math.max(100, width - M.left - M.right);
  const plotH = HEIGHT - M.top - M.bottom;
  const yTicks = niceTicks(0, Math.max(10, ...weeks.map((w) => w.load)), 3);
  const y1 = yTicks.at(-1) ?? 1;
  const slot = plotW / Math.max(1, n);
  const barW = Math.max(4, Math.min(28, slot - 2));
  const y = (v: number) => M.top + plotH - (v / (y1 || 1)) * plotH;
  const shown = hover ?? n - 1;
  const week = weeks[shown];

  return (
    <div className="session-chart" ref={ref}>
      <div className="chart-head">
        <h3>Carga por semana</h3>
      </div>
      {week && (
        <p className="readout" aria-live="polite">
          <span className="when">Semana del {weekFmt.format(week.weekMs)}</span>
          <span>
            Carga <b>{Math.round(week.load)}</b>
          </span>
          <span>
            Tiempo <b>{formatMinutes(week.durationSec)}</b>
          </span>
          <span>
            Sesiones <b>{week.sessions}</b>
          </span>
        </p>
      )}
      <svg width={width} height={HEIGHT} role="img" aria-label="Carga de entrenamiento por semana">
        {yTicks.map((t) => (
          <g key={t}>
            <line className="grid" x1={M.left} x2={M.left + plotW} y1={y(t)} y2={y(t)} />
            <text className="axis" x={M.left - 6} y={y(t) + 4} textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        {weeks.map((w, i) => {
          const cx = M.left + slot * (i + 0.5);
          const top = y(w.load);
          const h = M.top + plotH - top;
          const r = Math.min(4, h / 2, barW / 2);
          // Rounded only at the data end; square on the baseline.
          const d =
            h <= 0
              ? ''
              : `M${cx - barW / 2},${M.top + plotH}V${top + r}q0,${-r} ${r},${-r}h${barW - 2 * r}q${r},0 ${r},${r}V${M.top + plotH}Z`;
          return (
            <g key={w.weekMs}>
              {d && (
                <path
                  d={d}
                  className="bar"
                  style={{ opacity: hover === null || hover === i ? 1 : 0.55 }}
                />
              )}
              {(i % 3 === 0 || i === n - 1) && (
                <text className="axis" x={cx} y={HEIGHT - 6} textAnchor="middle">
                  {weekFmt.format(w.weekMs)}
                </text>
              )}
              <rect
                className="hit"
                x={M.left + slot * i}
                y={M.top}
                width={slot}
                height={plotH}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
              >
                <title>{`Semana del ${weekFmt.format(w.weekMs)}: carga ${Math.round(w.load)}`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
