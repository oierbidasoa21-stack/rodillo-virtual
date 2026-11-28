import { HR_CAP_MAX_BPM, HR_CAP_MIN_BPM, type HrCap } from '../../domain/zones/hrCap';
import { ZONE_IDS, isZoneId } from '../../domain/zones/zones';
import NumberInput from '../NumberInput';

/** Zones that can be a ceiling: the last one has no top. */
const CAP_ZONES = ZONE_IDS.slice(0, -1);
const DEFAULT_BPM = 160;

interface Props {
  value: HrCap | undefined;
  onChange: (cap: HrCap | undefined) => void;
  id: string;
  /** Text of the "no ceiling" option. */
  noneLabel: string;
  'aria-label'?: string;
}

/** Heart rate ceiling: none, "no pasar de Zn" or a number of ppm. */
export default function HrCapInput({ value, onChange, id, noneLabel, ...rest }: Props) {
  const mode = !value ? '' : value.type === 'bpm' ? 'bpm' : value.zoneId;
  return (
    <span className="capin">
      <select
        id={id}
        aria-label={rest['aria-label']}
        value={mode}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '') onChange(undefined);
          else if (v === 'bpm') onChange({ type: 'bpm', bpm: DEFAULT_BPM });
          else if (isZoneId(v)) onChange({ type: 'zone', zoneId: v });
        }}
      >
        <option value="">{noneLabel}</option>
        {CAP_ZONES.map((z) => (
          <option key={z} value={z}>
            No pasar de {z}
          </option>
        ))}
        <option value="bpm">En ppm…</option>
      </select>
      {value?.type === 'bpm' && (
        <>
          <NumberInput
            id={`${id}-bpm`}
            aria-label="Pulso máximo en ppm"
            min={HR_CAP_MIN_BPM}
            max={HR_CAP_MAX_BPM}
            value={value.bpm}
            onCommit={(bpm) => onChange({ type: 'bpm', bpm })}
          />
          ppm
        </>
      )}
    </span>
  );
}
