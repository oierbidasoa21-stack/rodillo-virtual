import type { Block, Repeat } from '../../domain/workout/types';
import NumberInput from '../NumberInput';
import BlockRow from './BlockRow';
import ItemControls from './ItemControls';

interface Props {
  repeat: Repeat;
  index: number;
  onTimes: (times: number) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
  onAddBlock: () => void;
  onBlockChange: (j: number, patch: Partial<Omit<Block, 'type'>>) => void;
  onBlockMove: (j: number, delta: -1 | 1) => void;
  onBlockRemove: (j: number) => void;
}

export default function RepeatGroup(props: Props) {
  const { repeat, index } = props;
  return (
    <div className="ed-rep">
      <div className="rephead">
        <span>
          <b className="rep-title">Repetir</b>{' '}
          <NumberInput
            id={`rep-${index}-times`}
            aria-label="Veces"
            min={1}
            value={repeat.times}
            onCommit={props.onTimes}
          />{' '}
          veces
        </span>
        <ItemControls onMove={props.onMove} onRemove={props.onRemove} />
      </div>
      {repeat.items.map((block, j) => (
        <BlockRow
          key={j}
          block={block}
          idPrefix={`b-${index}-${j}`}
          onChange={(patch) => props.onBlockChange(j, patch)}
          onMove={(delta) => props.onBlockMove(j, delta)}
          onRemove={() => props.onBlockRemove(j)}
        />
      ))}
      <div>
        <button type="button" className="btn ghost" onClick={props.onAddBlock}>
          Añadir bloque a la repetición
        </button>
      </div>
    </div>
  );
}
