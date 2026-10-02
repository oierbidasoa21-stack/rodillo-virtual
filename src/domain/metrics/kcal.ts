import { ZONE_IDS, ZONE_META } from '../zones/zones';
import type { SecByZone } from './timeInZone';

/** Relative uncertainty of the MET-based estimate (±20 %). */
export const KCAL_MET_UNCERTAINTY = 0.2;

/**
 * Estimated kcal without a power meter: MET of each zone × body weight (kg) × hours.
 * Always an estimate; the UI must label it as such.
 */
export function kcalByMet(secByZone: SecByZone, weightKg: number): number {
  return ZONE_IDS.reduce(
    (sum, id) => sum + ZONE_META[id].met * weightKg * (secByZone[id] / 3600),
    0,
  );
}
