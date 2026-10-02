import { isFresh } from '../../sensors/freshness';
import { useSensorsStore } from '../../store/sensorsStore';
import { useUiStore } from '../../store/uiStore';
import { useEstimatedPower } from '../hooks/useEstimatedPower';
import { useNow } from '../hooks/useNow';
import { formatSpeed } from './sensorText';

/** Header indicators: one per sensor, linking to the Sensores tab. */
export default function SensorChips() {
  const hr = useSensorsStore((s) => s.hr);
  const csc = useSensorsStore((s) => s.csc);
  const setTab = useUiStore((s) => s.setTab);
  const now = useNow();
  const power = useEstimatedPower();

  const hrLast = isFresh(hr.last, now) ? hr.last : null;
  const cscLast = isFresh(csc.last, now) ? csc.last : null;
  const sim = hr.source === 'simulated' || csc.source === 'simulated';

  const hrText = hrLast
    ? `♥ ${hrLast.bpm}`
    : hr.status === 'reconnecting'
      ? 'Pulsómetro: reconectando…'
      : 'Sin pulsómetro';
  const cscText =
    cscLast?.speedKmh != null
      ? formatSpeed(cscLast.speedKmh) +
        (power.watts === null ? '' : ` · ${Math.round(power.watts)} W`)
      : csc.status === 'reconnecting'
        ? 'Velocidad: reconectando…'
        : 'Sin velocidad';

  return (
    <button
      type="button"
      className="chips"
      onClick={() => setTab('sensors')}
      aria-label="Estado de los sensores"
    >
      <span className={hrLast ? 'chip on' : 'chip'}>
        <span className="dot" />
        <span className="num">{hrText}</span>
      </span>
      <span className={cscLast ? 'chip on' : 'chip'}>
        <span className="dot" />
        <span className="num">{cscText}</span>
      </span>
      {sim && <span className="sim-tag">SIMULADO</span>}
    </button>
  );
}
