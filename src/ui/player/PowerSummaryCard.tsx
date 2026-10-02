import type { PowerSummary } from '../../domain/metrics/summary';
import { POWER_ZONE_IDS } from '../../domain/zones/powerZones';
import { formatClock } from '../format';
import { powerZoneColor } from '../targetStyle';

const twoDecimals = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Power metrics of a finished session. Every figure is an estimate from the trainer curve. */
export default function PowerSummaryCard({ power }: { power: PowerSummary }) {
  const zones = power.secByPowerZone;
  const maxSec = zones ? Math.max(1, ...POWER_ZONE_IDS.map((id) => zones[id])) : 1;
  return (
    <>
      <div className="sectionhead">
        <h2>Potencia</h2>
        <span className="tag">
          Estimada con la curva del rodillo
          {power.simulated && <span className="sim-tag">SIMULADO</span>}
        </span>
      </div>
      <div className="stats">
        <div className="stat">
          <div className="v num">{Math.round(power.avgW)}</div>
          <div className="l">Media (W)</div>
        </div>
        <div className="stat">
          <div className="v num">{power.npW === null ? '—' : Math.round(power.npW)}</div>
          <div className="l">NP (W)</div>
        </div>
        <div className="stat">
          <div className="v num">{Math.round(power.maxW)}</div>
          <div className="l">Máxima (W)</div>
        </div>
        <div className="stat">
          <div className="v num">{Math.round(power.kJ)}</div>
          <div className="l">Trabajo (kJ)</div>
        </div>
        {power.ifactor !== null && (
          <div className="stat">
            <div className="v num">{twoDecimals.format(power.ifactor)}</div>
            <div className="l">IF</div>
          </div>
        )}
        {power.tss !== null && (
          <div className="stat">
            <div className="v num">{Math.round(power.tss)}</div>
            <div className="l">TSS</div>
          </div>
        )}
      </div>
      {zones ? (
        <div className="card" style={{ marginTop: 10 }}>
          {POWER_ZONE_IDS.map((id) => (
            <div className="zbar" key={id}>
              <b style={{ color: powerZoneColor(id) }}>{id}</b>
              <div className="bars">
                <div className="track">
                  <div
                    className="fill"
                    style={{
                      width: `${(zones[id] / maxSec) * 100}%`,
                      background: powerZoneColor(id),
                    }}
                  />
                </div>
              </div>
              <span className="t num">{formatClock(zones[id])}</span>
            </div>
          ))}
          <p className="note">Tiempo en cada zona de potencia, con tu FTP de ese momento.</p>
        </div>
      ) : (
        <p className="note">Sin FTP no hay IF, TSS ni zonas de potencia.</p>
      )}
    </>
  );
}
