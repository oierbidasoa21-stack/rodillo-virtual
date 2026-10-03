import type { RideInput, RideMode } from '../../domain/route/ride';
import { curveFor } from '../../domain/trainer/curves';
import { estimatePowerW } from '../../sensors/estimatedPower';
import { isFresh } from '../../sensors/freshness';
import { useSensorsStore } from '../../store/sensorsStore';
import { useSettingsStore } from '../../store/settingsStore';

/**
 * What moves the rider right now: estimated power and mass (power mode) or the
 * wheel speed (wheel mode). Also returns the watts used, for recording.
 */
export function currentRideInput(
  mode: RideMode,
  nowMs: number,
): { input: RideInput; watts: number | null } {
  const { settings } = useSettingsStore.getState();
  const { csc } = useSensorsStore.getState();
  if (mode === 'power') {
    const watts = estimatePowerW(csc.last, curveFor(settings.trainer), nowMs);
    const massKg = settings.athlete.weightKg + settings.athlete.bikeWeightKg;
    return { input: { mode, powerW: watts, massKg }, watts };
  }
  const wheelSpeedKmh = csc.last && isFresh(csc.last, nowMs) ? csc.last.speedKmh : null;
  return { input: { mode, wheelSpeedKmh }, watts: null };
}
