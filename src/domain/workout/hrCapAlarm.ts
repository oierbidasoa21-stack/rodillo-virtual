/** How often the alarm repeats while the heart rate stays over the ceiling. */
export const HR_CAP_REPEAT_SEC = 10;

export interface HrCapAlarm {
  /** When the current alarm last sounded; null while under the ceiling. */
  lastAlertSec: number | null;
}

export const startHrCapAlarm = (): HrCapAlarm => ({ lastAlertSec: null });

/**
 * Over the ceiling the alarm sounds at once, with none of the waits of the
 * zone cues, and again every 10 s while it stays over. Under it (or without a
 * reading or a ceiling) it rearms.
 */
export function hrCapTick(
  state: HrCapAlarm,
  nowSec: number,
  above: boolean | null,
): { state: HrCapAlarm; alert: boolean } {
  if (!above) return { state: { lastAlertSec: null }, alert: false };
  if (state.lastAlertSec === null || nowSec - state.lastAlertSec >= HR_CAP_REPEAT_SEC) {
    return { state: { lastAlertSec: nowSec }, alert: true };
  }
  return { state, alert: false };
}
