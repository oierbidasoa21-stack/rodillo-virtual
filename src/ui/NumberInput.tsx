import type { InputHTMLAttributes } from 'react';

interface Props extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'onBlur'
> {
  /** Null shows an empty field (only meaningful together with `onClear`). */
  value: number | null;
  /** Called with the parsed number when the field loses focus or Enter is pressed. */
  onCommit: (value: number) => void;
  /** If given, emptying the field commits "no value" instead of restoring the old one. */
  onClear?: () => void;
}

/**
 * Number field that commits on blur or Enter instead of on every keystroke,
 * so clearing it to type a new value doesn't push a 0 half-way through.
 * Re-mounts (via `key`) when the value changes from outside.
 */
export default function NumberInput({ value, onCommit, onClear, ...rest }: Props) {
  const commit = (input: HTMLInputElement) => {
    const parsed = input.valueAsNumber;
    if (Number.isNaN(parsed)) {
      if (input.value.trim() === '' && onClear) {
        if (value !== null) onClear();
      } else {
        input.value = value === null ? '' : String(value);
      }
    } else if (parsed !== value) {
      onCommit(parsed);
    }
  };
  return (
    <input
      key={value ?? 'empty'}
      type="number"
      inputMode="numeric"
      defaultValue={value ?? ''}
      onBlur={(e) => commit(e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit(e.currentTarget);
      }}
      {...rest}
    />
  );
}
