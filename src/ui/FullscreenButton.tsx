/** Enters or leaves full screen; says the shortcut in its tooltip. */
export default function FullscreenButton({
  active,
  supported,
  onToggle,
}: {
  active: boolean;
  supported: boolean;
  onToggle: () => void;
}) {
  if (!supported) return null;
  return (
    <button
      type="button"
      className="btn"
      aria-pressed={active}
      title={active ? 'Salir de pantalla completa (F o Esc)' : 'Pantalla completa (F)'}
      onClick={onToggle}
    >
      {active ? 'Salir de pantalla completa' : 'Pantalla completa'}
    </button>
  );
}
