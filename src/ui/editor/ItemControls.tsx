interface Props {
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}

/** Move up, move down and remove buttons for an editor row. */
export default function ItemControls({ onMove, onRemove }: Props) {
  return (
    <span className="ctl">
      <button type="button" aria-label="Subir" onClick={() => onMove(-1)}>
        ↑
      </button>
      <button type="button" aria-label="Bajar" onClick={() => onMove(1)}>
        ↓
      </button>
      <button type="button" aria-label="Quitar" onClick={onRemove}>
        ✕
      </button>
    </span>
  );
}
