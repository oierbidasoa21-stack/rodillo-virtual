import { useMemo } from 'react';
import { curveFor } from '../../domain/trainer/curves';
import { estimatePowerW } from '../../sensors/estimatedPower';
import { useSensorsStore } from '../../store/sensorsStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useNow } from './useNow';

/** Live estimated power from the speed sensor and the chosen trainer curve. */
export function useEstimatedPower(intervalMs = 500): { watts: number | null; simulated: boolean } {
  const trainer = useSettingsStore((s) => s.settings.trainer);
  const csc = useSensorsStore((s) => s.csc);
  const now = useNow(intervalMs);
  const curve = useMemo(() => curveFor(trainer), [trainer]);
  return { watts: estimatePowerW(csc.last, curve, now), simulated: csc.source === 'simulated' };
}
