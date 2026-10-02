import { hrPer10sToBpm } from '../domain/zones/heartRate';
import type { HrZone } from '../domain/zones/zones';

/** `m:ss`, or `h:mm:ss` from one hour. Rounds to whole seconds. */
export function formatClock(sec: number): string {
  const total = Math.max(0, Math.round(sec));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Rounded minutes: `45′`, or `1 h 05′` from one hour. */
export function formatMinutes(sec: number): string {
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}′` : `${m}′`;
}

/** Bounds of a zone in /10″ without the unit: `25–26`, `29`, `30+`. */
export function zoneBounds(zone: HrZone): string {
  if (zone.max === null) return `${zone.min}+`;
  return zone.min === zone.max ? `${zone.min}` : `${zone.min}–${zone.max}`;
}

export function zoneRangeText(zone: HrZone): string {
  return `${zoneBounds(zone)} /10″`;
}

export function zoneBpmText(zone: HrZone): string {
  const min = hrPer10sToBpm(zone.min);
  if (zone.max === null) return `${min}+ ppm`;
  const max = hrPer10sToBpm(zone.max);
  return min === max ? `${min} ppm` : `${min}–${max} ppm`;
}
