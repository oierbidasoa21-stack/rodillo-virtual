import { type HrZone, isZoneId, validateZones } from './zones';

/** Shape of `config/athlete.*.json` and of the athlete part of the settings. */
export interface AthleteConfig {
  weightKg: number;
  bikeWeightKg: number;
  /** Rolling circumference of the rear wheel, for speed from a wheel sensor. */
  wheelCircumferenceMm: number;
  hrZonesPer10s: HrZone[];
  /** Functional threshold power, or null while unknown (no power targets in watts). */
  ftp: Ftp | null;
}

export type FtpSource = 'ramp' | 'manual';

export interface Ftp {
  watts: number;
  source: FtpSource;
  /** When it was set (ms since epoch); 0 if unknown. */
  dateMs: number;
}

export const FTP_RANGE_W = { min: 50, max: 600 } as const;

/** 700×32 road tyre. Used when an athlete file has no wheel circumference. */
export const DEFAULT_WHEEL_CIRCUMFERENCE_MM = 2155;
export const WHEEL_CIRCUMFERENCE_RANGE_MM = { min: 1000, max: 3000 } as const;

export type ParseResult<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const inRange = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

/** Validates an imported athlete config. Error messages are shown to the user. */
export function parseAthleteConfig(input: unknown): ParseResult<AthleteConfig> {
  if (!isRecord(input)) return { ok: false, errors: ['El archivo no contiene un objeto JSON.'] };

  const errors: string[] = [];
  const { weightKg, bikeWeightKg, hrZonesPer10s } = input;
  const wheelCircumferenceMm = input.wheelCircumferenceMm ?? DEFAULT_WHEEL_CIRCUMFERENCE_MM;

  if (!inRange(weightKg, 30, 200)) errors.push('weightKg: tiene que ser un número entre 30 y 200.');
  if (!inRange(bikeWeightKg, 0, 40)) {
    errors.push('bikeWeightKg: tiene que ser un número entre 0 y 40.');
  }
  const wheel = WHEEL_CIRCUMFERENCE_RANGE_MM;
  if (!inRange(wheelCircumferenceMm, wheel.min, wheel.max)) {
    errors.push(`wheelCircumferenceMm: tiene que ser un número entre ${wheel.min} y ${wheel.max}.`);
  }

  const zones: HrZone[] = [];
  if (!Array.isArray(hrZonesPer10s)) {
    errors.push('hrZonesPer10s: tiene que ser una lista de zonas.');
  } else {
    hrZonesPer10s.forEach((z: unknown, i) => {
      if (
        !isRecord(z) ||
        !isZoneId(z.id) ||
        typeof z.min !== 'number' ||
        !(typeof z.max === 'number' || z.max === null)
      ) {
        errors.push(`hrZonesPer10s[${i}]: necesita id, min y max (número o null).`);
        return;
      }
      zones.push({
        id: z.id,
        label: typeof z.label === 'string' && z.label.trim() ? z.label : z.id,
        min: z.min,
        max: z.max,
      });
    });
    if (zones.length === hrZonesPer10s.length) errors.push(...validateZones(zones));
  }

  const ftp = parseFtp(input.ftp);
  if (ftp === undefined) {
    errors.push(`ftp: null, o un objeto con watts entre ${FTP_RANGE_W.min} y ${FTP_RANGE_W.max}.`);
  }

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      weightKg: weightKg as number,
      bikeWeightKg: bikeWeightKg as number,
      wheelCircumferenceMm: wheelCircumferenceMm as number,
      hrZonesPer10s: zones,
      ftp: ftp ?? null,
    },
  };
}

/** Missing or null → null (unknown); malformed → undefined (an error). */
function parseFtp(v: unknown): Ftp | null | undefined {
  if (v === undefined || v === null) return null;
  if (!isRecord(v) || !inRange(v.watts, FTP_RANGE_W.min, FTP_RANGE_W.max)) return undefined;
  return {
    watts: Math.round(v.watts),
    source: v.source === 'ramp' ? 'ramp' : 'manual',
    dateMs: typeof v.dateMs === 'number' && Number.isFinite(v.dateMs) ? v.dateMs : 0,
  };
}
