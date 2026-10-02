import type { HrZone, ZoneId } from '../../domain/zones/zones';

/**
 * Reference FTP for the simulator when the athlete has none (e.g. during the
 * ramp test that will measure it). Only shapes simulated heart rate.
 */
export const SIM_REFERENCE_FTP_W = 250;

/** Rough heart rate zone for an effort as a fraction of FTP. Simulation only. */
function zoneForEffort(effort: number): ZoneId {
  if (effort < 0.56) return 'L1';
  if (effort < 0.76) return 'L2';
  if (effort < 0.91) return 'L3';
  if (effort < 1.06) return 'UA';
  if (effort < 1.21) return 'UA+';
  return 'VO2';
}

/** Middle of a zone in bpm (open-ended top zone: one beat per 10 s above its start). */
export function zoneMidBpm(zone: HrZone): number {
  const top = zone.max ?? zone.min + 1;
  return Math.round(((zone.min + top) / 2) * 6);
}

/** Simulated heart rate target for a power effort, in the athlete's zones. */
export function simulatedBpmForEffort(effort: number, zones: readonly HrZone[]): number {
  const zone = zones.find((z) => z.id === zoneForEffort(effort)) ?? zones[0];
  return zone ? zoneMidBpm(zone) : 120;
}
