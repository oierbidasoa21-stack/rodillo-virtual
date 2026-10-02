import { BLOCK_KIND_LABELS, type BlockTarget, type Step } from '../domain/workout/types';
import type { ZoneId } from '../domain/zones/zones';

/** How each zone is read aloud in Spanish. */
const SPOKEN_ZONE: Readonly<Record<ZoneId, string>> = {
  L1: 'L uno',
  L2: 'L dos',
  L3: 'L tres',
  UA: 'umbral',
  'UA+': 'umbral más',
  VO2: 'VO dos',
};

/** "umbral", "ochenta y ocho por ciento" (digits; the voice reads them), "240 vatios" */
function spokenTarget(target: BlockTarget): string {
  switch (target.type) {
    case 'hr':
      return SPOKEN_ZONE[target.zoneId];
    case 'power':
      return `${Math.round(target.pctFtp)} por ciento`;
    case 'watts':
      return `${Math.round(target.watts)} vatios`;
  }
}

function spokenDuration(durationSec: number): string {
  if (durationSec < 60) return `${durationSec} segundos`;
  const min = Math.round(durationSec / 60);
  return `${min} ${min === 1 ? 'minuto' : 'minutos'}`;
}

/** "Serie, umbral, 10 minutos" */
export function announceStep(step: Step): string {
  return `${BLOCK_KIND_LABELS[step.kind]}, ${spokenTarget(step.target)}, ${spokenDuration(step.durationSec)}`;
}

/** Said 10 seconds before a step ends. */
export function announceWarning(next: Step | null): string {
  if (!next) return 'Diez segundos para terminar';
  return `En diez segundos: ${BLOCK_KIND_LABELS[next.kind].toLowerCase()}, ${spokenTarget(next.target)}`;
}
