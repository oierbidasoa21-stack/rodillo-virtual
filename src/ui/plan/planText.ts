import type { PlanDay } from '../../domain/plan/plan';
import { expandWorkout, totalDurationSec } from '../../domain/workout/expand';
import type { BlockTarget } from '../../domain/workout/types';
import { formatMinutes } from '../format';

export const dayFmt = new Intl.DateTimeFormat('es-ES', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

/** Local midnight of a YYYY-MM-DD date. */
export const dateMs = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getTime();
};

/** "Z4", "90 % FTP" or "240 W". */
const targetText = (t: BlockTarget) =>
  t.type === 'hr' ? t.zoneId : t.type === 'power' ? `${t.pctFtp} % FTP` : `${t.watts} W`;

/** "4×4′ Z4 · 3′ Z1" style summary of the main work of a day. */
export function daySummary(day: PlanDay): string {
  if (!day.workout) return 'Descanso';
  const total = totalDurationSec(expandWorkout(day.workout.blocks));
  const parts = day.workout.blocks.map((b) => {
    if (b.type === 'repeat') {
      const first = b.items[0];
      return first
        ? `${b.times}×${formatMinutes(first.durationSec)} ${targetText(first.target)}`
        : '';
    }
    return `${formatMinutes(b.durationSec)} ${targetText(b.target)}`;
  });
  // A single block already says it all: "1 h 15′ Z2".
  if (parts.length === 1) return parts[0] ?? formatMinutes(total);
  return `${formatMinutes(total)} · ${parts.filter(Boolean).join(' · ')}`;
}
