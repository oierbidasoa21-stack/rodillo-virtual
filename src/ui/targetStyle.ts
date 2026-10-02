import type { BlockTarget } from '../domain/workout/types';
import { POWER_ZONE_IDS, type PowerZoneId, powerZoneOfPct } from '../domain/zones/powerZones';
import { ZONE_IDS, type ZoneId } from '../domain/zones/zones';
import { zoneColor } from './zoneStyle';

/**
 * Reference FTP for drawing fixed-watt blocks when the athlete has none yet.
 * Only affects bar heights and colours, never a number shown to the user.
 */
const FALLBACK_FTP_FOR_DRAWING_W = 250;

/** Power zones share the six zone colours; Z7 reuses the top one. */
function colourZoneForPct(pct: number): ZoneId {
  const index = Math.min(POWER_ZONE_IDS.indexOf(powerZoneOfPct(pct)), ZONE_IDS.length - 1);
  return ZONE_IDS[index] ?? 'VO2';
}

/** Intensity step 0–5 used for bar height and colour. */
function colourZone(target: BlockTarget, ftpW: number | null): ZoneId {
  switch (target.type) {
    case 'hr':
      return target.zoneId;
    case 'power':
      return colourZoneForPct(target.pctFtp / 100);
    case 'watts':
      return colourZoneForPct(target.watts / (ftpW ?? FALLBACK_FTP_FOR_DRAWING_W));
  }
}

export function targetColor(target: BlockTarget, ftpW: number | null = null): string {
  return zoneColor(colourZone(target, ftpW));
}

/** Bar height in % for the workout profile. */
export function targetHeightPct(target: BlockTarget, ftpW: number | null = null): number {
  return 22 + ZONE_IDS.indexOf(colourZone(target, ftpW)) * 15.6;
}

/** "L3", "88 % FTP", "240 W" */
export function targetShortLabel(target: BlockTarget): string {
  switch (target.type) {
    case 'hr':
      return target.zoneId;
    case 'power':
      return `${Math.round(target.pctFtp)} % FTP`;
    case 'watts':
      return `${Math.round(target.watts)} W`;
  }
}

/** Colour of a power zone (Z1–Z6 share the six zone colours; Z7 reuses the top one). */
export function powerZoneColor(id: PowerZoneId): string {
  const index = Math.min(POWER_ZONE_IDS.indexOf(id), ZONE_IDS.length - 1);
  return zoneColor(ZONE_IDS[index] ?? 'VO2');
}
