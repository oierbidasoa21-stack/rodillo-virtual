import { joinDuration, splitDuration } from '../../domain/workout/edit';
import { BLOCK_KINDS, BLOCK_KIND_LABELS, type Block } from '../../domain/workout/types';
import { targetColor, targetShortLabel } from '../targetStyle';
import { ZONE_IDS, isZoneId } from '../../domain/zones/zones';
import NumberInput from '../NumberInput';
import { zoneColor } from '../zoneStyle';
import ItemControls from './ItemControls';

interface Props {
  block: Block;
  /** Unique per row, used for input ids. */
  idPrefix: string;
  onChange: (patch: Partial<Omit<Block, 'type'>>) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}

export default function BlockRow({ block, idPrefix, onChange, onMove, onRemove }: Props) {
  const { min, sec } = splitDuration(block.durationSec);
  return (
    <div className="ed-row">
      <span className="durin">
        <NumberInput
          id={`${idPrefix}-min`}
          aria-label="Minutos"
          min={0}
          value={min}
          onCommit={(m) => onChange({ durationSec: joinDuration(m, sec) })}
        />
        ′
        <NumberInput
          id={`${idPrefix}-sec`}
          aria-label="Segundos"
          min={0}
          max={59}
          step={5}
          value={sec}
          onCommit={(s) => onChange({ durationSec: joinDuration(min, s) })}
        />
        ″
      </span>
      {block.target.type === 'hr' ? (
        <select
          className="zsel"
          aria-label="Zona"
          value={block.target.zoneId}
          style={{ color: zoneColor(block.target.zoneId) }}
          onChange={(e) => {
            if (isZoneId(e.target.value)) {
              onChange({ target: { type: 'hr', zoneId: e.target.value } });
            }
          }}
        >
          {ZONE_IDS.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      ) : (
        <span className="zsel" style={{ color: targetColor(block.target) }}>
          {targetShortLabel(block.target)}
        </span>
      )}
      <span className="meta">
        <select
          aria-label="Tipo de bloque"
          value={block.kind}
          onChange={(e) => {
            const kind = BLOCK_KINDS.find((k) => k === e.target.value);
            if (kind) onChange({ kind });
          }}
        >
          {BLOCK_KINDS.map((k) => (
            <option key={k} value={k}>
              {BLOCK_KIND_LABELS[k]}
            </option>
          ))}
        </select>
        <input
          type="text"
          aria-label="Nota"
          placeholder="Nota (opcional)"
          value={block.note}
          onChange={(e) => onChange({ note: e.target.value })}
        />
      </span>
      <ItemControls onMove={onMove} onRemove={onRemove} />
    </div>
  );
}
