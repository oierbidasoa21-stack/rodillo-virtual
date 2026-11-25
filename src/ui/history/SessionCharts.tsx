import { useState } from 'react';
import { hrPer10sToBpm } from '../../domain/zones/heartRate';
import { type HrZone, ZONE_IDS } from '../../domain/zones/zones';
import { type ChartChannel, channelRange } from '../../recording/chart';
import type { RecordSample } from '../../recording/recording';
import { formatClock } from '../format';
import { zoneColor } from '../zoneStyle';
import SessionChart, { type ChartBand } from './SessionChart';

interface ChannelSpec {
  channel: ChartChannel;
  title: string;
  unit: string;
  decimals: number;
  fromZero: boolean;
}

/** Heart rate zones as chart backgrounds, in bpm. */
function zoneBands(zones: readonly HrZone[]): ChartBand[] {
  return ZONE_IDS.flatMap((id, i) => {
    const z = zones.find((x) => x.id === id);
    if (!z) return [];
    const next = zones.find((x) => x.id === ZONE_IDS[i + 1]);
    const to = next ? next.min : (z.max ?? z.min + 9) + 1;
    return [{ from: hrPer10sToBpm(z.min), to: hrPer10sToBpm(to), color: zoneColor(id) }];
  });
}

const fmt = (v: number, decimals: number) =>
  v.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/**
 * The recorded channels of a session, one small chart each over the same time
 * axis, with a shared readout of the second under the pointer.
 */
export default function SessionCharts({
  samples,
  zones,
  powerEstimated,
  simulated,
}: {
  samples: readonly RecordSample[];
  zones: readonly HrZone[];
  powerEstimated: boolean;
  simulated: boolean;
}) {
  const [hoverT, setHoverT] = useState<number | null>(null);
  const specs: ChannelSpec[] = [
    { channel: 'hr', title: 'Pulso (ppm)', unit: 'ppm', decimals: 0, fromZero: false },
    {
      channel: 'powerW',
      title: powerEstimated ? 'Potencia (W, estimada)' : 'Potencia (W)',
      unit: 'W',
      decimals: 0,
      fromZero: true,
    },
    { channel: 'speedKmh', title: 'Velocidad (km/h)', unit: 'km/h', decimals: 1, fromZero: true },
    { channel: 'cadenceRpm', title: 'Cadencia (rpm)', unit: 'rpm', decimals: 0, fromZero: true },
    { channel: 'altitudeM', title: 'Altitud (m)', unit: 'm', decimals: 0, fromZero: false },
  ];
  const present = specs.flatMap((s) => {
    const range = channelRange(samples, s.channel);
    return range ? [{ ...s, range }] : [];
  });
  if (!present.length) {
    return <p className="note">La sesión se grabó sin ningún sensor conectado.</p>;
  }

  const at = hoverT !== null ? samples[hoverT - 1] : undefined;
  return (
    <div className="card session-charts">
      <div className="readout num" aria-live="polite">
        <span className="when">{at ? formatClock(at.t) : 'Media'}</span>
        {present.map((s) => {
          const v = at ? at[s.channel] : s.range.avg;
          return (
            <span key={s.channel}>
              <b>{v === null ? '—' : fmt(v, s.decimals)}</b> {s.unit}
            </span>
          );
        })}
        {simulated && <span className="sim-tag">SIMULADO</span>}
      </div>
      {present.map((s) => (
        <SessionChart
          key={s.channel}
          title={s.title}
          channel={s.channel}
          samples={samples}
          hoverT={hoverT}
          onHover={setHoverT}
          fromZero={s.fromZero}
          {...(s.channel === 'hr' ? { bands: zoneBands(zones) } : {})}
        />
      ))}
    </div>
  );
}
