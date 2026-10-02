export const POWER_ZONE_IDS = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'Z7'] as const;
export type PowerZoneId = (typeof POWER_ZONE_IDS)[number];

/** Coggan power zones: lower bound as a fraction of FTP. */
const ZONE_DEFS: readonly { id: PowerZoneId; fromPct: number; name: string }[] = [
  { id: 'Z1', fromPct: 0, name: 'Recuperación activa' },
  { id: 'Z2', fromPct: 0.56, name: 'Resistencia' },
  { id: 'Z3', fromPct: 0.76, name: 'Tempo' },
  { id: 'Z4', fromPct: 0.91, name: 'Umbral' },
  { id: 'Z5', fromPct: 1.06, name: 'VO2máx' },
  { id: 'Z6', fromPct: 1.21, name: 'Capacidad anaeróbica' },
  { id: 'Z7', fromPct: 1.51, name: 'Neuromuscular' },
];

export interface PowerZone {
  id: PowerZoneId;
  name: string;
  /** Inclusive lower bound in watts. */
  minW: number;
  /** Inclusive upper bound in watts; null for the open-ended top zone. */
  maxW: number | null;
}

/** Zones in watts for an FTP: Z1 < 56 %, Z2 56–75 %, … Z7 > 150 %. */
export function powerZones(ftpW: number): PowerZone[] {
  return ZONE_DEFS.map((z, i) => {
    const next = ZONE_DEFS[i + 1];
    return {
      id: z.id,
      name: z.name,
      minW: Math.round(z.fromPct * ftpW),
      maxW: next ? Math.round(next.fromPct * ftpW) - 1 : null,
    };
  });
}

/** Zone of an effort given as a fraction of FTP (0.88 = 88 %). */
export function powerZoneOfPct(pct: number): PowerZoneId {
  let id: PowerZoneId = 'Z1';
  for (const z of ZONE_DEFS) if (pct >= z.fromPct) id = z.id;
  return id;
}

export function powerZoneOfWatts(watts: number, ftpW: number): PowerZoneId {
  return powerZoneOfPct(watts / ftpW);
}
