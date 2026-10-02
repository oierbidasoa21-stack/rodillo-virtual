import { BLOCK_KIND_LABELS, type Step } from '../domain/workout/types';
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

function spokenDuration(durationSec: number): string {
  if (durationSec < 60) return `${durationSec} segundos`;
  const min = Math.round(durationSec / 60);
  return `${min} ${min === 1 ? 'minuto' : 'minutos'}`;
}

/** "Serie, umbral, 10 minutos" */
export function announceStep(step: Step): string {
  return `${BLOCK_KIND_LABELS[step.kind]}, ${SPOKEN_ZONE[step.zoneId]}, ${spokenDuration(step.durationSec)}`;
}

/** Said 10 seconds before a step ends. */
export function announceWarning(next: Step | null): string {
  if (!next) return 'Diez segundos para terminar';
  return `En diez segundos: ${BLOCK_KIND_LABELS[next.kind].toLowerCase()}, ${SPOKEN_ZONE[next.zoneId]}`;
}
