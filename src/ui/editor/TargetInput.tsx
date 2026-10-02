import { targetWatts } from '../../domain/workout/targets';
import type { BlockTarget } from '../../domain/workout/types';
import { ZONE_IDS, isZoneId } from '../../domain/zones/zones';
import { useSettingsStore } from '../../store/settingsStore';
import NumberInput from '../NumberInput';
import { targetColor, targetShortLabel } from '../targetStyle';
import { zoneColor } from '../zoneStyle';

const PCT_FTP_RANGE = { min: 30, max: 200 } as const;
/** New power blocks start at an easy endurance effort. */
const DEFAULT_PCT_FTP = 75;

interface Props {
  target: BlockTarget;
  idPrefix: string;
  onChange: (target: BlockTarget) => void;
}

/** Heart rate zone or % of FTP for one block. Fixed watts (ramp test) are read-only. */
export default function TargetInput({ target, idPrefix, onChange }: Props) {
  const ftpW = useSettingsStore((s) => s.settings.athlete.ftp?.watts ?? null);

  if (target.type === 'watts') {
    return (
      <span className="zsel" style={{ color: targetColor(target, ftpW) }}>
        {targetShortLabel(target)}
      </span>
    );
  }

  const watts = targetWatts(target, ftpW);
  return (
    <span className="target-in">
      <select
        aria-label="Objetivo por"
        value={target.type}
        onChange={(e) =>
          onChange(
            e.target.value === 'power'
              ? { type: 'power', pctFtp: DEFAULT_PCT_FTP }
              : { type: 'hr', zoneId: 'L2' },
          )
        }
      >
        <option value="hr">Pulso</option>
        <option value="power">Potencia</option>
      </select>
      {target.type === 'hr' ? (
        <select
          className="zsel"
          aria-label="Zona"
          value={target.zoneId}
          style={{ color: zoneColor(target.zoneId) }}
          onChange={(e) => {
            if (isZoneId(e.target.value)) onChange({ type: 'hr', zoneId: e.target.value });
          }}
        >
          {ZONE_IDS.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      ) : (
        <span className="pct" style={{ color: targetColor(target, ftpW) }}>
          <NumberInput
            id={`${idPrefix}-pct`}
            aria-label="% del FTP"
            min={PCT_FTP_RANGE.min}
            max={PCT_FTP_RANGE.max}
            value={target.pctFtp}
            onCommit={(pct) =>
              onChange({
                type: 'power',
                pctFtp: Math.round(Math.min(PCT_FTP_RANGE.max, Math.max(PCT_FTP_RANGE.min, pct))),
              })
            }
          />
          % FTP
          {watts !== null && <span className="note num"> ≈ {Math.round(watts)} W</span>}
        </span>
      )}
    </span>
  );
}
