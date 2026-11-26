const dayFmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });

/** Gap to your best earlier ride on this route: behind (+) or ahead (−) in seconds. */
export default function GhostChip({ gapSec, dateMs }: { gapSec: number | null; dateMs: number }) {
  const when = dayFmt.format(dateMs);
  if (gapSec === null) {
    return (
      <p className="ghost-chip" role="status">
        Fantasma ({when}): has pasado de donde llegó
      </p>
    );
  }
  const s = Math.round(Math.abs(gapSec));
  const text = s === 0 ? 'a la par' : gapSec > 0 ? `${s} s detrás` : `${s} s delante`;
  const tone = s === 0 ? '' : gapSec > 0 ? 'behind' : 'ahead';
  return (
    <p className={`ghost-chip ${tone}`} role="status">
      Fantasma ({when}) · <b>{text}</b>
    </p>
  );
}
