export const ZONE_IDS = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6'] as const;
export type ZoneId = (typeof ZONE_IDS)[number];

/**
 * Names the zones had until phase 9, same position, weights and MET. Still
 * accepted wherever old data comes in (backups, athlete file, coach plans, .zwo).
 */
export const LEGACY_ZONE_IDS: Readonly<Record<string, ZoneId>> = {
  L1: 'Z1',
  L2: 'Z2',
  L3: 'Z3',
  UA: 'Z4',
  'UA+': 'Z5',
  VO2: 'Z6',
};

/** Default label of each zone (Z4 is the threshold). */
export const DEFAULT_ZONE_LABELS: Readonly<Record<ZoneId, string>> = {
  Z1: 'Z1',
  Z2: 'Z2',
  Z3: 'Z3',
  Z4: 'Z4 (umbral)',
  Z5: 'Z5',
  Z6: 'Z6',
};

/** Heart rate zone in beats counted over 10 seconds. `max: null` means no upper bound. */
export interface HrZone {
  id: ZoneId;
  label: string;
  min: number;
  max: number | null;
}

/** Fixed, non-personal properties of each zone. */
export interface ZoneMeta {
  /** Load points per minute spent in the zone. */
  loadWeight: number;
  /** Metabolic equivalent used for the kcal estimate. */
  met: number;
  /** How the zone feels, shown to the rider. */
  feel: string;
}

export const ZONE_META: Readonly<Record<ZoneId, ZoneMeta>> = {
  Z1: { loadWeight: 1, met: 5.0, feel: 'Muy suave. Puedes hablar sin problema.' },
  Z2: { loadWeight: 2, met: 6.8, feel: 'Cómodo. Hablas con frases largas.' },
  Z3: { loadWeight: 3, met: 8.8, feel: 'Moderado. Frases cortas.' },
  Z4: { loadWeight: 4, met: 11.0, feel: 'Umbral. Pocas palabras, duro pero sostenible.' },
  Z5: { loadWeight: 5, met: 12.0, feel: 'Por encima del umbral. Hablar cuesta mucho.' },
  Z6: { loadWeight: 6, met: 14.0, feel: 'Máximo. Sin hablar, esfuerzos cortos.' },
};

export type ZoneStatus = 'below' | 'in' | 'above';

/** Strict: only the current names (Z1…Z6). */
export function isZoneId(value: unknown): value is ZoneId {
  return typeof value === 'string' && (ZONE_IDS as readonly string[]).includes(value);
}

/** A zone id from a current or legacy name (L1…VO2), or null. */
export function toZoneId(value: unknown): ZoneId | null {
  if (isZoneId(value)) return value;
  return typeof value === 'string' ? (LEGACY_ZONE_IDS[value] ?? null) : null;
}

export function findZone(zones: readonly HrZone[], id: ZoneId): HrZone {
  const zone = zones.find((z) => z.id === id);
  if (!zone) throw new Error(`Unknown zone ${id}`);
  return zone;
}

/**
 * Zone that a 10-second count falls in, or `null` when it is below the first zone.
 * Assumes zones are sorted ascending (see `validateZones`).
 */
export function classifyPer10s(valuePer10s: number, zones: readonly HrZone[]): HrZone | null {
  const first = zones[0];
  if (!first || valuePer10s < first.min) return null;
  for (const zone of zones) {
    if (zone.max === null || valuePer10s <= zone.max) return zone;
  }
  return zones[zones.length - 1] ?? null;
}

/** Whether a 10-second count is below, inside or above the target zone. */
export function zoneStatus(valuePer10s: number, target: HrZone): ZoneStatus {
  if (valuePer10s < target.min) return 'below';
  if (target.max !== null && valuePer10s > target.max) return 'above';
  return 'in';
}

/**
 * Sets one bound of a zone and moves the neighbouring bound so zones stay
 * contiguous: a new `max` moves the next zone's `min`, a new `min` moves the
 * previous zone's `max`. The result can still be invalid (e.g. min > max);
 * check it with `validateZones`.
 */
export function setZoneBound(
  zones: readonly HrZone[],
  id: ZoneId,
  bound: 'min' | 'max',
  value: number,
): HrZone[] {
  const i = zones.findIndex((z) => z.id === id);
  if (i < 0) return [...zones];
  return zones.map((z, k) => {
    if (k === i) return { ...z, [bound]: value };
    if (bound === 'max' && k === i + 1) return { ...z, min: value + 1 };
    if (bound === 'min' && k === i - 1 && z.max !== null) return { ...z, max: value - 1 };
    return z;
  });
}

/**
 * Checks that zones are the six known ids, in order, with integer bounds,
 * contiguous (each zone starts one beat after the previous ends) and only
 * the last one open-ended. Returns error messages for the UI; empty when valid.
 */
export function validateZones(zones: readonly HrZone[]): string[] {
  const errors: string[] = [];
  if (zones.length !== ZONE_IDS.length || zones.some((z, i) => z.id !== ZONE_IDS[i])) {
    return [`Tiene que haber ${ZONE_IDS.length} zonas en orden: ${ZONE_IDS.join(', ')}.`];
  }
  zones.forEach((zone, i) => {
    const isLast = i === zones.length - 1;
    if (!Number.isInteger(zone.min) || zone.min <= 0) {
      errors.push(`${zone.id}: el inicio tiene que ser un número entero positivo.`);
    }
    if (zone.max === null) {
      if (!isLast) errors.push(`${zone.id}: solo la última zona puede no tener final.`);
    } else if (!Number.isInteger(zone.max) || zone.max < zone.min) {
      errors.push(`${zone.id}: el final tiene que ser un entero mayor o igual que el inicio.`);
    }
    const prev = zones[i - 1];
    if (prev && prev.max !== null && zone.min !== prev.max + 1) {
      errors.push(`${zone.id}: tiene que empezar en ${prev.max + 1}, justo después de ${prev.id}.`);
    }
  });
  return errors;
}
