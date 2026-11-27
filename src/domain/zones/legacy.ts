import { DEFAULT_ZONE_LABELS, LEGACY_ZONE_IDS, type ZoneId } from './zones';

/** Labels the example athlete had before phase 9: replaced, unlike labels the user wrote. */
const LEGACY_DEFAULT_LABELS: Readonly<Record<string, ZoneId>> = {
  L1: 'Z1',
  L2: 'Z2',
  L3: 'Z3',
  'UA (umbral)': 'Z4',
  'UA+': 'Z5',
  VO2: 'Z6',
};

/** Fields that hold one zone id. */
const ID_KEYS = new Set(['zoneId', 'targetZoneId']);
/** Fields that hold seconds per zone, keyed by zone id. */
const SEC_BY_ZONE_KEYS = new Set(['plannedSecByZone', 'actualSecByZone', 'secByZone']);
/** Field that holds the athlete's heart rate zones. */
const ATHLETE_ZONES_KEY = 'hrZonesPer10s';

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const renameId = (v: unknown): unknown =>
  typeof v === 'string' && v in LEGACY_ZONE_IDS ? LEGACY_ZONE_IDS[v] : v;

function renameKeys(v: unknown): unknown {
  if (!isRecord(v)) return v;
  return Object.fromEntries(Object.entries(v).map(([k, sec]) => [renameId(k) as string, sec]));
}

function migrateAthleteZone(v: unknown): unknown {
  if (!isRecord(v)) return v;
  const id = renameId(v.id);
  const label =
    typeof v.label === 'string' && v.label in LEGACY_DEFAULT_LABELS && id !== v.id
      ? DEFAULT_ZONE_LABELS[id as ZoneId]
      : v.label;
  return { ...v, id, label };
}

/**
 * Renames the heart rate zones of a stored value from the old names (L1, L2,
 * L3, UA, UA+, VO2) to Z1…Z6, walking the whole value: block targets and HR
 * counts (`zoneId`, `targetZoneId`), seconds per zone (`plannedSecByZone`,
 * `actualSecByZone`, `secByZone`) and the athlete's zones (`hrZonesPer10s`:
 * the id, and the label only while it is still the example one).
 *
 * Power zones (`secByPowerZone`, already Z1…Z7) and free text (names, notes)
 * are left alone. Values already on Z1…Z6 come back unchanged. Returns a copy.
 */
export function migrateLegacyZoneIds<T>(value: T): T {
  return walk(value) as T;
}

function walk(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(walk);
  if (!isRecord(v)) return v;
  const out: Record<string, unknown> = {};
  for (const [k, child] of Object.entries(v)) {
    if (ID_KEYS.has(k)) out[k] = renameId(child);
    else if (SEC_BY_ZONE_KEYS.has(k)) out[k] = renameKeys(child);
    else if (k === ATHLETE_ZONES_KEY && Array.isArray(child))
      out[k] = child.map(migrateAthleteZone);
    else out[k] = walk(child);
  }
  return out;
}
