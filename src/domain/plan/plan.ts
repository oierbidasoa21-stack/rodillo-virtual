import {
  type Block,
  type BlockKind,
  type BlockTarget,
  type Repeat,
  type Workout,
  type WorkoutItem,
} from '../workout/types';
import { toZoneId } from '../zones/zones';

/** Tag that identifies a plan written for this app (by the user's coaching agent). */
export const PLAN_FORMAT = 'rodillo-virtual/plan@1';

/** One day of a training plan: a workout, or a rest day. */
export interface PlanDay {
  /** Local date, YYYY-MM-DD. */
  date: string;
  title: string;
  notes: string;
  /** Null on a rest day. */
  workout: Workout | null;
}

export interface TrainingPlan {
  id: string;
  name: string;
  importedAtMs: number;
  days: PlanDay[];
}

export interface PlanParseResult {
  plan: Omit<TrainingPlan, 'id' | 'importedAtMs'> | null;
  /** Problems that stop the import, in Spanish. */
  errors: string[];
}

const KINDS: Record<string, BlockKind> = {
  calentamiento: 'warm',
  serie: 'work',
  recuperacion: 'rec',
  recuperación: 'rec',
  vuelta: 'cool',
  'vuelta a la calma': 'cool',
  bloque: 'steady',
};
const MAX_BLOCK_SEC = 6 * 3600;
const MAX_REPEAT = 30;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/**
 * The JSON inside whatever was pasted: agents often wrap it in prose or a
 * ```json fence. Takes the first fenced block, else the outermost {...}.
 */
export function extractJson(text: string): unknown {
  // A fenced ```json block wins; otherwise the outermost braces.
  const fenced = /```(?:json)?[ \t]*\r?\n([\s\S]*?)```/.exec(text);
  if (fenced?.[1]?.includes('{')) text = fenced[1];
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('No hay ningún objeto JSON en el texto.');
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error('El JSON no es válido (revisa comas y comillas).');
  }
}

function parseBlock(raw: unknown, where: string, errors: string[]): Block | null {
  if (!isObj(raw)) {
    errors.push(`${where}: el bloque no es un objeto.`);
    return null;
  }
  const kindName = str(raw.tipo).toLowerCase() || 'bloque';
  const kind = KINDS[kindName];
  if (!kind) errors.push(`${where}: tipo «${kindName}» desconocido.`);
  const min = typeof raw.min === 'number' ? raw.min : 0;
  const seg = typeof raw.seg === 'number' ? raw.seg : 0;
  const durationSec = Math.round(min * 60 + seg);
  if (!(durationSec > 0) || durationSec > MAX_BLOCK_SEC) {
    errors.push(`${where}: duración no válida (usa "min" y/o "seg", hasta 6 h).`);
  }
  let target: BlockTarget | null = null;
  if (raw.zona !== undefined) {
    // Also L1…VO2, in case the agent still uses the names from before phase 9.
    const zoneId = toZoneId(raw.zona);
    if (zoneId) target = { type: 'hr', zoneId };
    else errors.push(`${where}: zona «${String(raw.zona)}» no existe (Z1, Z2, Z3, Z4, Z5, Z6).`);
  } else if (typeof raw.ftp === 'number' && raw.ftp > 0 && raw.ftp <= 300) {
    target = { type: 'power', pctFtp: raw.ftp };
  } else {
    errors.push(`${where}: falta "zona" (o "ftp" en %).`);
  }
  if (!kind || !target || !(durationSec > 0) || durationSec > MAX_BLOCK_SEC) return null;
  return { type: 'block', durationSec, target, kind, note: str(raw.nota) };
}

function parseItems(raw: unknown, where: string, errors: string[]): WorkoutItem[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    errors.push(`${where}: faltan "bloques".`);
    return [];
  }
  const items: WorkoutItem[] = [];
  raw.forEach((b, i) => {
    const at = `${where}, bloque ${i + 1}`;
    if (isObj(b) && b.repetir !== undefined) {
      const times = typeof b.repetir === 'number' ? Math.round(b.repetir) : 0;
      if (times < 1 || times > MAX_REPEAT) errors.push(`${at}: "repetir" entre 1 y ${MAX_REPEAT}.`);
      if (!Array.isArray(b.bloques) || b.bloques.length === 0) {
        errors.push(`${at}: una repetición necesita sus "bloques".`);
        return;
      }
      const inner: Block[] = [];
      b.bloques.forEach((x: unknown, j: number) => {
        if (isObj(x) && x.repetir !== undefined) {
          errors.push(`${at}.${j + 1}: no se pueden anidar repeticiones.`);
          return;
        }
        const block = parseBlock(x, `${at}.${j + 1}`, errors);
        if (block) inner.push(block);
      });
      if (times >= 1 && times <= MAX_REPEAT && inner.length) {
        items.push({ type: 'repeat', times, items: inner } satisfies Repeat);
      }
      return;
    }
    const block = parseBlock(b, at, errors);
    if (block) items.push(block);
  });
  return items;
}

/**
 * Reads a plan written by the coaching agent (format `rodillo-virtual/plan@1`,
 * Spanish keys). Any problem is reported and nothing is imported.
 */
export function parsePlan(text: string): PlanParseResult {
  let data: unknown;
  try {
    data = extractJson(text);
  } catch (e) {
    return { plan: null, errors: [(e as Error).message] };
  }
  const errors: string[] = [];
  if (!isObj(data)) return { plan: null, errors: ['El plan debe ser un objeto JSON.'] };
  if (data.formato !== PLAN_FORMAT) {
    errors.push(`Falta "formato": "${PLAN_FORMAT}" (¿es un plan para esta app?).`);
  }
  if (!Array.isArray(data.dias) || data.dias.length === 0) {
    errors.push('Faltan los "dias" del plan.');
    return { plan: null, errors };
  }
  const days: PlanDay[] = [];
  const seen = new Set<string>();
  data.dias.forEach((raw: unknown, i: number) => {
    const where = `Día ${i + 1}`;
    if (!isObj(raw)) {
      errors.push(`${where}: no es un objeto.`);
      return;
    }
    const date = str(raw.fecha);
    if (!DATE_RE.test(date) || Number.isNaN(Date.parse(date))) {
      errors.push(`${where}: "fecha" debe ser AAAA-MM-DD.`);
      return;
    }
    if (seen.has(date)) errors.push(`${where}: la fecha ${date} está repetida.`);
    seen.add(date);
    const notes = str(raw.notas);
    if (raw.descanso === true) {
      days.push({ date, title: str(raw.titulo) || 'Descanso', notes, workout: null });
      return;
    }
    const title = str(raw.titulo);
    if (!title) errors.push(`${where} (${date}): falta "titulo".`);
    const blocks = parseItems(raw.bloques, `${where} (${date})`, errors);
    days.push({
      date,
      title,
      notes,
      workout: { id: `plan-${date}`, name: title, description: notes, blocks },
    });
  });
  if (errors.length) return { plan: null, errors };
  days.sort((a, b) => a.date.localeCompare(b.date));
  const name = str(data.nombre) || `Plan del ${days[0]?.date ?? ''}`;
  return { plan: { name, days }, errors: [] };
}

/** YYYY-MM-DD of a moment, in local time. */
export function localDate(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Whether a plan day was ridden: a saved session that day with the same name. */
export function dayDone(
  day: PlanDay,
  sessions: readonly { dateMs: number; workoutName: string }[],
): boolean {
  return (
    day.workout !== null &&
    sessions.some((s) => localDate(s.dateMs) === day.date && s.workoutName === day.workout?.name)
  );
}
