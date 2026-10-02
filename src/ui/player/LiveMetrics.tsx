import { type HrZone, zoneStatus } from '../../domain/zones/zones';
import { isFresh } from '../../sensors/freshness';
import { useSensorsStore } from '../../store/sensorsStore';
import { useEstimatedPower } from '../hooks/useEstimatedPower';
import { useNow } from '../hooks/useNow';
import { formatPer10s, formatSpeed } from '../sensors/sensorText';
import { STATUS_CLASS, STATUS_TEXT } from './zoneStatusText';

/**
 * Live heart rate against the block's zone, plus speed and cadence. Only fresh
 * readings are shown; nothing appears for a sensor that isn't sending.
 */
/** `zone` is the block's heart rate zone; null for power blocks (no in/out status). */
export default function LiveMetrics({ zone }: { zone: HrZone | null }) {
  const hr = useSensorsStore((s) => s.hr);
  const csc = useSensorsStore((s) => s.csc);
  const now = useNow(500);
  const power = useEstimatedPower();

  const hrLast = isFresh(hr.last, now) ? hr.last : null;
  const cscLast = isFresh(csc.last, now) ? csc.last : null;
  if (!hrLast && !cscLast && power.watts === null) return null;

  // Rounded like a hand count, so e.g. 135 ppm (22.5) reads as 23.
  const status = hrLast && zone ? zoneStatus(Math.round(hrLast.bpm / 6), zone) : null;
  const simulated = hr.source === 'simulated' || csc.source === 'simulated';

  return (
    <div className="live" aria-live="polite">
      {hrLast && (
        <div className="live-hr">
          <span className={`bpm num ${status ? STATUS_CLASS[status] : ''}`}>{hrLast.bpm}</span>
          <span className="num">ppm · {formatPer10s(hrLast.bpm)} /10″</span>
          {status && (
            <span className={`live-status ${STATUS_CLASS[status]}`}>{STATUS_TEXT[status]}</span>
          )}
        </div>
      )}
      {power.watts !== null && (
        <div className="live-power num">
          <b>{Math.round(power.watts)}</b> W <span className="est">est.</span>
        </div>
      )}
      {cscLast && (cscLast.speedKmh !== null || cscLast.cadenceRpm !== null) && (
        <div className="live-csc num">
          {cscLast.speedKmh !== null && <span>{formatSpeed(cscLast.speedKmh)}</span>}
          {cscLast.cadenceRpm !== null && <span>{Math.round(cscLast.cadenceRpm)} rpm</span>}
        </div>
      )}
      {simulated && <span className="sim-tag">SIMULADO</span>}
    </div>
  );
}
