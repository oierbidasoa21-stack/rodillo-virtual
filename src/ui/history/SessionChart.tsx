import type { KeyboardEvent, PointerEvent } from 'react';
import { type ChartChannel, channelRange, chartRuns, niceTicks } from '../../recording/chart';
import type { RecordSample } from '../../recording/recording';
import { useElementWidth } from '../hooks/useElementWidth';

const HEIGHT = 130;
const M = { left: 44, right: 12, top: 8, bottom: 22 };

export interface ChartBand {
  from: number;
  to: number;
  color: string;
}

interface Props {
  title: string;
  channel: ChartChannel;
  samples: readonly RecordSample[];
  /** Second under the pointer, shared by every chart of the session. */
  hoverT: number | null;
  onHover: (t: number | null) => void;
  /** Coloured backgrounds, e.g. heart rate zones. */
  bands?: ChartBand[];
  /** Keeps 0 on the axis (power, speed). */
  fromZero?: boolean;
}

/** One channel of a recorded session over time: a 2 px line with a crosshair. */
export default function SessionChart({
  title,
  channel,
  samples,
  hoverT,
  onHover,
  bands = [],
  fromZero = false,
}: Props) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const range = channelRange(samples, channel);
  if (!range) return null;

  const plotW = Math.max(100, width - M.left - M.right);
  const plotH = HEIGHT - M.top - M.bottom;
  const n = samples.length;
  const yTicks = niceTicks(fromZero ? 0 : range.min, range.max, 3);
  const y0 = yTicks[0] ?? 0;
  const y1 = yTicks.at(-1) ?? 1;
  const x = (t: number) => M.left + (t / Math.max(1, n)) * plotW;
  const y = (v: number) => M.top + plotH - ((v - y0) / (y1 - y0 || 1)) * plotH;
  const clampY = (v: number) => Math.min(M.top + plotH, Math.max(M.top, y(v)));
  const minutes = n / 60;
  const xTicks = niceTicks(0, minutes, Math.max(2, Math.floor(plotW / 110))).filter(
    (m) => m <= minutes,
  );

  const runs = chartRuns(samples, channel, Math.floor(plotW / 2));
  const base = M.top + plotH;
  const paths = runs.map((run) =>
    run.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(''),
  );
  const areas = runs.map((run, k) => {
    const last = x(run.at(-1)?.t ?? 0).toFixed(1);
    const first = x(run[0]?.t ?? 0).toFixed(1);
    return `${paths[k] ?? ''}L${last},${base}L${first},${base}Z`;
  });

  const hovered = hoverT !== null ? samples[hoverT - 1] : undefined;
  const hv = hovered?.[channel] ?? null;

  const pick = (e: PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const t = Math.round(((e.clientX - box.left) / box.width) * n);
    onHover(Math.min(n, Math.max(1, t)));
  };
  const keys = (e: KeyboardEvent<SVGSVGElement>) => {
    const step = e.shiftKey ? 60 : 10;
    if (e.key === 'ArrowRight') onHover(Math.min(n, (hoverT ?? 0) + step));
    else if (e.key === 'ArrowLeft') onHover(Math.max(1, (hoverT ?? n) - step));
    else return;
    e.preventDefault();
  };

  return (
    <div className="session-chart" ref={ref}>
      <span className="tag">{title}</span>
      <svg
        width={M.left + plotW + M.right}
        height={HEIGHT}
        role="img"
        aria-label={`${title}: de ${Math.round(range.min)} a ${Math.round(range.max)}, media ${Math.round(range.avg)}`}
        tabIndex={0}
        onKeyDown={keys}
        onBlur={() => onHover(null)}
      >
        {bands.map((b) => {
          const top = clampY(b.to);
          const bottom = clampY(b.from);
          return bottom > top ? (
            <rect
              key={`${b.from}-${b.to}`}
              x={M.left}
              width={plotW}
              y={top}
              height={bottom - top}
              fill={b.color}
              opacity={0.14}
            />
          ) : null;
        })}
        {yTicks.map((v) => (
          <g key={v}>
            <line className="grid" x1={M.left} x2={M.left + plotW} y1={y(v)} y2={y(v)} />
            <text className="axis" x={M.left - 6} y={y(v) + 4} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {xTicks.map((m) => (
          <text
            key={m}
            className="axis"
            x={x(m * 60)}
            y={HEIGHT - 6}
            textAnchor={m === 0 ? 'start' : x(m * 60) > M.left + plotW - 12 ? 'end' : 'middle'}
          >
            {m}′
          </text>
        ))}
        {areas.map((d, k) => (
          <path key={`a${k}`} className="area" d={d} />
        ))}
        {paths.map((d, k) => (
          <path key={`l${k}`} className="line" d={d} />
        ))}
        {hoverT !== null && (
          <line className="crosshair" x1={x(hoverT)} x2={x(hoverT)} y1={M.top} y2={base} />
        )}
        {hoverT !== null && hv !== null && (
          <circle className="dot" cx={x(hoverT)} cy={y(hv)} r={4} />
        )}
        <rect
          className="hit"
          x={M.left}
          y={M.top}
          width={plotW}
          height={plotH}
          onPointerMove={pick}
          onPointerDown={pick}
          onPointerLeave={() => onHover(null)}
        />
      </svg>
    </div>
  );
}
