import { ZONE_IDS, type ZoneId } from '../domain/zones/zones';

/** CSS colour of a zone (`--z1` … `--z6`), following the active theme. */
export function zoneColor(id: ZoneId): string {
  return `var(--z${ZONE_IDS.indexOf(id) + 1})`;
}

/** Zones whose colour is light enough to need dark text on top. */
export function needsDarkText(id: ZoneId): boolean {
  return id === 'L3';
}
