import type { InputHTMLAttributes } from 'react';

interface Props extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'onBlur'
> {
  value: number;
  /** Called with the parsed number when the field loses focus or Enter is pressed. */
  onCommit: (value: number) => void;
}

/**
 * Number field that commits on blur or Enter instead of on every keystroke,
 * so clearing it to type a new value doesn't push a 0 half-way through.
 * Re-mounts (via `key`) when the value changes from outside.
 */
export default function NumberInput({ value, onCommit, ...rest }: Props) {
  const commit = (input: HTMLInputElement) => {
    const parsed = input.valueAsNumber;
    if (Number.isNaN(parsed)) input.value = String(value);
    else if (parsed !== value) onCommit(parsed);
  };
  return (
    <input
      key={value}
      type="number"
      inputMode="numeric"
      defaultValue={value}
      onBlur={(e) => commit(e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit(e.currentTarget);
      }}
      {...rest}
    />
  );
}
