import { useSettingsStore } from '../store/settingsStore';
import { zoneBounds } from './format';
import { needsDarkText, zoneColor } from './zoneStyle';

/** The athlete's zones at a glance, in /10″. */
export default function ZoneStrip() {
  const zones = useSettingsStore((s) => s.settings.athlete.hrZonesPer10s);
  return (
    <div className="zonestrip" aria-label="Zonas de pulso en 10 segundos">
      {zones.map((z) => (
        <div
          key={z.id}
          className={needsDarkText(z.id) ? 'zt-dark' : undefined}
          style={{ background: zoneColor(z.id) }}
        >
          <b>{z.id}</b>
          <span className="num">{zoneBounds(z)}</span>
        </div>
      ))}
    </div>
  );
}
