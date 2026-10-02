export const ZONE_IDS = ['L1', 'L2', 'L3', 'UA', 'UA+', 'VO2'] as const;
export type ZoneId = (typeof ZONE_IDS)[number];

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
  L1: { loadWeight: 1, met: 5.0, feel: 'Muy suave. Puedes hablar sin problema.' },
  L2: { loadWeight: 2, met: 6.8, feel: 'Cómodo. Hablas con frases largas.' },
  L3: { loadWeight: 3, met: 8.8, feel: 'Moderado. Frases cortas.' },
  UA: { loadWeight: 4, met: 11.0, feel: 'Umbral. Pocas palabras, duro pero sostenible.' },
  'UA+': { loadWeight: 5, met: 12.0, feel: 'Por encima del umbral. Hablar cuesta mucho.' },
  VO2: { loadWeight: 6, met: 14.0, feel: 'Máximo. Sin hablar, esfuerzos cortos.' },
};

export type ZoneStatus = 'below' | 'in' | 'above';

export function isZoneId(value: unknown): value is ZoneId {
  return typeof value === 'string' && (ZONE_IDS as readonly string[]).includes(value);
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
