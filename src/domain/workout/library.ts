import type { ZoneId } from '../zones/zones';
import { type Block, type BlockKind, type Workout, makeBlock, makeRepeat } from './types';

/** Block from a duration in minutes, to keep the library readable. */
const B = (min: number, zone: ZoneId, kind: BlockKind = 'steady', note = ''): Block =>
  makeBlock(Math.round(min * 60), zone, kind, note);

const R = makeRepeat;

const WARM_UP = [B(10, 'L1', 'warm'), B(5, 'L2', 'warm', 'Sube cadencia poco a poco')];

/** Built-in sessions. Read-only: users duplicate them to edit. */
export const BUILTIN_WORKOUTS: readonly Workout[] = [
  {
    id: 'b-fondo',
    name: 'Fondo L2',
    description: 'Rodaje aeróbico continuo. Base para todo lo demás.',
    blocks: [B(10, 'L1', 'warm'), B(55, 'L2', 'steady', 'Cadencia 85–95 rpm'), B(5, 'L1', 'cool')],
  },
  {
    id: 'b-tempo',
    name: 'Tempo 3×12′ L3',
    description: 'Ritmo sostenido por debajo del umbral, recuperaciones cortas.',
    blocks: [...WARM_UP, R(3, [B(12, 'L3', 'work'), B(4, 'L1', 'rec')]), B(8, 'L1', 'cool')],
  },
  {
    id: 'b-ua3x10',
    name: 'Umbral 3×10′',
    description: 'Series en UA, el entrenamiento clave para subir el umbral.',
    blocks: [...WARM_UP, R(3, [B(10, 'UA', 'work'), B(4, 'L1', 'rec')]), B(10, 'L1', 'cool')],
  },
  {
    id: 'b-ua2x20',
    name: 'Umbral 2×20′',
    description: 'Versión larga del umbral. Para cuando 3×10′ ya sale cómodo.',
    blocks: [
      ...WARM_UP,
      R(2, [B(20, 'UA', 'work', 'Constante, sin picos'), B(5, 'L1', 'rec')]),
      B(10, 'L1', 'cool'),
    ],
  },
  {
    id: 'b-overunder',
    name: 'Over-unders 3×10′',
    description: 'Alterna UA y UA+ dentro de la serie: enseña a recuperar bajo carga.',
    blocks: [
      ...WARM_UP,
      R(3, [
        B(4, 'UA', 'work'),
        B(1, 'UA+', 'work'),
        B(4, 'UA', 'work'),
        B(1, 'UA+', 'work'),
        B(5, 'L1', 'rec'),
      ]),
      B(8, 'L1', 'cool'),
    ],
  },
  {
    id: 'b-vo2x5',
    name: 'VO2 5×3′',
    description: 'Esfuerzos cortos al máximo sostenible, recuperación igual a la serie.',
    blocks: [
      ...WARM_UP,
      B(2, 'L3', 'warm', 'Activación'),
      B(3, 'L1', 'warm'),
      R(5, [B(3, 'VO2', 'work'), B(3, 'L1', 'rec')]),
      B(10, 'L1', 'cool'),
    ],
  },
  {
    id: 'b-3030',
    name: '30/30 · 2×10',
    description: 'Diez repeticiones de 30″ fuerte y 30″ suave, dos bloques.',
    blocks: [
      ...WARM_UP,
      R(10, [B(0.5, 'VO2', 'work'), B(0.5, 'L1', 'rec')]),
      B(6, 'L1', 'rec'),
      R(10, [B(0.5, 'VO2', 'work'), B(0.5, 'L1', 'rec')]),
      B(10, 'L1', 'cool'),
    ],
  },
  {
    id: 'b-piramide',
    name: 'Pirámide',
    description: 'Sube de L3 a VO2 y baja, con 2′ suaves entre escalones.',
    blocks: [
      ...WARM_UP,
      B(4, 'L3', 'work'),
      B(2, 'L1', 'rec'),
      B(4, 'UA', 'work'),
      B(2, 'L1', 'rec'),
      B(3, 'UA+', 'work'),
      B(2, 'L1', 'rec'),
      B(2, 'VO2', 'work'),
      B(2, 'L1', 'rec'),
      B(3, 'UA+', 'work'),
      B(2, 'L1', 'rec'),
      B(4, 'UA', 'work'),
      B(2, 'L1', 'rec'),
      B(4, 'L3', 'work'),
      B(8, 'L1', 'cool'),
    ],
  },
];
