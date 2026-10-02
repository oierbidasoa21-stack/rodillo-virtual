import { useEffect, useState } from 'react';

const ARMED_MS = 3000;

interface Props {
  label: string;
  armedLabel?: string;
  className?: string;
  onConfirm: () => void;
}

/** Destructive action that needs a second press within 3 s. No dialogs. */
export default function ConfirmButton({
  label,
  armedLabel = '¿Seguro? Pulsa otra vez',
  className = 'btn ghost danger',
  onConfirm,
}: Props) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), ARMED_MS);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
    >
      {armed ? armedLabel : label}
    </button>
  );
}
