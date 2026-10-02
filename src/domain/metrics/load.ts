import { ZONE_IDS, ZONE_META } from '../zones/zones';
import type { SecByZone } from './timeInZone';

/**
 * Heart-rate training load: minutes in each zone times the zone's weight
 * (L1 1 … VO2 6). A TRIMP-style number to compare sessions with each other.
 */
export function zoneLoad(secByZone: SecByZone): number {
  return ZONE_IDS.reduce((sum, id) => sum + (secByZone[id] / 60) * ZONE_META[id].loadWeight, 0);
}
