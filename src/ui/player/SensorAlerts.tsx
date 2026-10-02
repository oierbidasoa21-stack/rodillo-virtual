import { useEffect, useRef } from 'react';
import { beep } from '../../audio/beeper';
import type { SensorKind, SensorStatus } from '../../sensors/types';
import { useSensorsStore } from '../../store/sensorsStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';

const LOST_TEXT: Readonly<Record<SensorKind, string>> = {
  hr: 'Pulsómetro desconectado · reconectando…',
  csc: 'Sensor de velocidad desconectado · reconectando…',
};
const BACK_TEXT: Readonly<Record<SensorKind, string>> = {
  hr: 'Pulsómetro reconectado',
  csc: 'Sensor de velocidad reconectado',
};

/** Warns (bar + beep) when a sensor drops during the session, and says when it's back. */
export default function SensorAlerts() {
  const hr = useSensorsStore((s) => s.hr.status);
  const csc = useSensorsStore((s) => s.csc.status);
  const showToast = useUiStore((s) => s.showToast);
  const previous = useRef<Record<SensorKind, SensorStatus>>({ hr, csc });

  useEffect(() => {
    const now: Record<SensorKind, SensorStatus> = { hr, csc };
    for (const kind of ['hr', 'csc'] as const) {
      const before = previous.current[kind];
      if (now[kind] === 'reconnecting' && before !== 'reconnecting') {
        if (useSettingsStore.getState().settings.beeps) {
          beep(440, 250);
          beep(330, 350, 0.3);
        }
      }
      if (now[kind] === 'connected' && before === 'reconnecting') showToast(BACK_TEXT[kind]);
    }
    previous.current = now;
  }, [hr, csc, showToast]);

  const lost = (['hr', 'csc'] as const).filter((k) => ({ hr, csc })[k] === 'reconnecting');
  if (!lost.length) return null;
  return (
    <div className="sensor-alert" role="alert">
      {lost.map((k) => (
        <p key={k}>{LOST_TEXT[k]}</p>
      ))}
    </div>
  );
}
