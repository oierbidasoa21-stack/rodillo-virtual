import { type ZoneId, toZoneId } from '../zones/zones';
import {
  type Block,
  type BlockKind,
  type BlockTarget,
  type Workout,
  type WorkoutItem,
  makeBlock,
  makeRepeat,
} from './types';

/**
 * `.zwo` is the XML structured-workout format many trainer apps share: blocks with
 * power as a fraction of FTP. Read and written here without a DOM, so it runs in Node.
 */

export class ZwoError extends Error {}

export interface ZwoImport {
  workout: Omit<Workout, 'id'>;
  /** What changed on the way in (ramps as steps, skipped elements…). */
  warnings: string[];
}

/** Ramps become steps of this length, because our blocks have one fixed target. */
export const RAMP_STEP_SEC = 60;

/**
 * Marker in a FreeRide's message that carries one of our heart rate zones:
 * `Zona Z2 (pulso)`, or `Zona L2 (pulso)` in files exported before phase 9.
 * The lookahead (not `\b`, which does not end `UA+` correctly) ends the name.
 */
const ZONE_MESSAGE = /^Zona (Z[1-6]|L1|L2|L3|UA\+?|VO2)(?=\s|$)/;

interface Element {
  name: string;
  attrs: Record<string, string>;
  children: Element[];
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

function decode(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (whole, code: string) => {
    if (code.startsWith('#x') || code.startsWith('#X'))
      return String.fromCodePoint(parseInt(code.slice(2), 16));
    if (code.startsWith('#')) return String.fromCodePoint(parseInt(code.slice(1), 10));
    return ENTITIES[code.toLowerCase()] ?? whole;
  });
}

function encode(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Elements inside <workout>, with attributes; text is not needed there. */
function parseElements(xml: string): Element[] {
  const root: Element = { name: '#root', attrs: {}, children: [] };
  const stack = [root];
  const tag = /<(\/?)([A-Za-z_][\w.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g;
  for (const m of xml.matchAll(tag)) {
    const [, closing, name = '', rawAttrs = '', selfClosing] = m;
    if (closing) {
      const i = stack.map((e) => e.name.toLowerCase()).lastIndexOf(name.toLowerCase());
      if (i > 0) stack.length = i;
      continue;
    }
    const attrs: Record<string, string> = {};
    for (const a of rawAttrs.matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      attrs[(a[1] ?? '').toLowerCase()] = decode(a[2] ?? a[3] ?? '');
    }
    const el: Element = { name, attrs, children: [] };
    stack.at(-1)?.children.push(el);
    if (!selfClosing) stack.push(el);
  }
  return root.children;
}

function textOf(xml: string, name: string): string {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i').exec(xml);
  return m ? decode((m[1] ?? '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')).trim() : '';
}

function find(elements: Element[], name: string): Element | undefined {
  for (const e of elements) {
    if (e.name.toLowerCase() === name) return e;
    const inner = find(e.children, name);
    if (inner) return inner;
  }
  return undefined;
}

function num(el: Element, ...names: string[]): number | null {
  for (const n of names) {
    const v = el.attrs[n.toLowerCase()];
    if (v !== undefined && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  }
  return null;
}

const pct = (fraction: number) => Math.round(fraction * 100);
const power = (fraction: number): BlockTarget => ({ type: 'power', pctFtp: pct(fraction) });

function messages(el: Element): string[] {
  return el.children
    .filter((c) => c.name.toLowerCase() === 'textevent')
    .map((c) => (c.attrs.message ?? '').trim())
    .filter(Boolean);
}

function duration(el: Element, label: string): number {
  const d = num(el, 'Duration');
  if (d === null || !(d > 0)) throw new ZwoError(`Un bloque ${label} no tiene duración.`);
  return Math.round(d);
}

/** A linear ramp from `low` to `high` as steps of 1′, each at its own mean. */
function rampSteps(durationSec: number, low: number, high: number, kind: BlockKind): Block[] {
  const steps: Block[] = [];
  for (let from = 0; from < durationSec; from += RAMP_STEP_SEC) {
    const to = Math.min(durationSec, from + RAMP_STEP_SEC);
    const mid = (from + to) / 2 / durationSec;
    steps.push(makeBlock(to - from, power(low + (high - low) * mid), kind));
  }
  return steps;
}

/** Reads a `.zwo` file. Throws ZwoError if it is not one or has no usable blocks. */
export function parseZwo(xml: string): ZwoImport {
  if (!/<workout_file[\s>]/i.test(xml)) {
    throw new ZwoError('No es un archivo .zwo: falta <workout_file>.');
  }
  const body = find(parseElements(xml.replace(/<!--[\s\S]*?-->/g, '')), 'workout');
  if (!body) throw new ZwoError('El archivo no tiene bloques (<workout>).');

  const warnings = new Set<string>();
  const blocks: WorkoutItem[] = [];
  for (const el of body.children) {
    const type = el.name.toLowerCase();
    const note = messages(el)[0] ?? '';
    switch (type) {
      case 'steadystate': {
        const p = num(el, 'Power', 'PowerLow');
        if (p === null) throw new ZwoError('Un bloque SteadyState no tiene potencia.');
        blocks.push(makeBlock(duration(el, type), power(p), 'steady', note));
        break;
      }
      case 'warmup':
      case 'cooldown':
      case 'ramp': {
        const low = num(el, 'PowerLow');
        const high = num(el, 'PowerHigh');
        if (low === null || high === null) {
          throw new ZwoError(`Un bloque ${el.name} no tiene PowerLow y PowerHigh.`);
        }
        const kind: BlockKind =
          type === 'warmup' ? 'warm' : type === 'cooldown' ? 'cool' : 'steady';
        const steps = rampSteps(duration(el, type), low, high, kind);
        if (steps.length > 1)
          warnings.add('Las rampas se han convertido en escalones de 1 minuto.');
        if (steps[0] && note) steps[0] = { ...steps[0], note };
        blocks.push(...steps);
        break;
      }
      case 'intervalst': {
        const times = Math.round(num(el, 'Repeat') ?? 1);
        const on = num(el, 'OnDuration');
        const off = num(el, 'OffDuration');
        const onP = num(el, 'OnPower', 'PowerOnHigh', 'PowerOnLow');
        const offP = num(el, 'OffPower', 'PowerOffLow', 'PowerOffHigh');
        if (!(times >= 1) || !(on && on > 0) || onP === null) {
          throw new ZwoError('Un bloque IntervalsT está incompleto.');
        }
        const items = [makeBlock(Math.round(on), power(onP), 'work', note)];
        if (off && off > 0 && offP !== null) {
          items.push(makeBlock(Math.round(off), power(offP), 'rec'));
        }
        if (times > 1) blocks.push(makeRepeat(times, items));
        else blocks.push(...items);
        break;
      }
      case 'freeride':
      case 'maxeffort': {
        // Our own heart rate blocks come back with their zone.
        const zone = messages(el)
          .map((m) => toZoneId(ZONE_MESSAGE.exec(m)?.[1]))
          .find((z): z is ZoneId => z !== null);
        if (zone) {
          const rest = messages(el).filter((m) => !ZONE_MESSAGE.test(m));
          blocks.push(makeBlock(duration(el, type), zone, 'steady', rest[0] ?? ''));
        } else if (type === 'maxeffort') {
          blocks.push(makeBlock(duration(el, type), 'Z6', 'work', note || 'Máximo esfuerzo'));
          warnings.add('MaxEffort no tiene objetivo: se ha puesto como bloque por pulso en Z6.');
        } else {
          blocks.push(makeBlock(duration(el, type), 'Z2', 'steady', note || 'Rodaje libre'));
          warnings.add('FreeRide no tiene objetivo: se ha puesto como bloque por pulso en Z2.');
        }
        break;
      }
      case 'textevent':
        break;
      default:
        warnings.add(`Se ha saltado un bloque que no se conoce: ${el.name}.`);
    }
  }
  if (!blocks.length) throw new ZwoError('El archivo no tiene ningún bloque que se pueda usar.');
  return {
    workout: {
      name: textOf(xml, 'name') || 'Sesión importada',
      description: textOf(xml, 'description'),
      blocks,
    },
    warnings: [...warnings],
  };
}

export interface ZwoExport {
  xml: string;
  warnings: string[];
}

function textevent(message: string): string {
  return `<textevent timeoffset="0" message="${encode(message)}"/>`;
}

function blockXml(b: Block, warnings: Set<string>): string {
  const note = b.note ? textevent(b.note) : '';
  const d = b.durationSec;
  const t = b.target;
  if (t.type === 'power') {
    return `<SteadyState Duration="${d}" Power="${(t.pctFtp / 100).toFixed(2)}">${note}</SteadyState>`;
  }
  if (t.type === 'hr') {
    warnings.add(
      'Los bloques por pulso se exportan como rodaje libre (FreeRide) con la zona en un mensaje: otras apps no los seguirán, esta app sí los recupera.',
    );
    return `<FreeRide Duration="${d}">${textevent(`Zona ${t.zoneId} (pulso)`)}${note}</FreeRide>`;
  }
  warnings.add(
    'Los bloques en vatios fijos se exportan como rodaje libre con los vatios en un mensaje.',
  );
  return `<FreeRide Duration="${d}">${textevent(`${Math.round(t.watts)} W`)}${note}</FreeRide>`;
}

/** Writes a workout as `.zwo`. Heart rate blocks become FreeRide with their zone. */
export function buildZwo(workout: Pick<Workout, 'name' | 'description' | 'blocks'>): ZwoExport {
  const warnings = new Set<string>();
  const lines: string[] = [];
  for (const item of workout.blocks) {
    if (item.type === 'block') {
      lines.push(blockXml(item, warnings));
      continue;
    }
    const [on, off] = item.items;
    const simple =
      item.items.length === 2 &&
      on?.target.type === 'power' &&
      off?.target.type === 'power' &&
      !off.note;
    if (simple && on.target.type === 'power' && off.target.type === 'power') {
      const note = on.note ? textevent(on.note) : '';
      lines.push(
        `<IntervalsT Repeat="${item.times}" OnDuration="${on.durationSec}" OffDuration="${off.durationSec}" OnPower="${(on.target.pctFtp / 100).toFixed(2)}" OffPower="${(off.target.pctFtp / 100).toFixed(2)}">${note}</IntervalsT>`,
      );
    } else {
      // .zwo has no general repeat: write it out in full.
      for (let i = 0; i < item.times; i++) {
        for (const b of item.items) lines.push(blockXml(b, warnings));
      }
    }
  }
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<workout_file>',
    `  <author>Rodillo Virtual</author>`,
    `  <name>${encode(workout.name)}</name>`,
    `  <description>${encode(workout.description)}</description>`,
    '  <sportType>bike</sportType>',
    '  <workout>',
    ...lines.map((l) => `    ${l}`),
    '  </workout>',
    '</workout_file>',
    '',
  ].join('\n');
  return { xml, warnings: [...warnings] };
}

/** `nombre-de-la-sesion.zwo`, plain ASCII. */
export function zwoFileName(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'sesion'}.zwo`;
}
