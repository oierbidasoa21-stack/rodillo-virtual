import { useState } from 'react';
import { RAMP, type RampResult } from '../../domain/workout/ramp';
import { powerZones } from '../../domain/zones/powerZones';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';

interface Props {
  result: RampResult | null;
  /** Power came from the simulated sensor: say so, it's not a real FTP. */
  simulated: boolean;
}

/** Ramp test outcome: estimated FTP, best minute, zones and "save as my FTP". */
export default function RampResultCard({ result, simulated }: Props) {
  const updateAthlete = useSettingsStore((s) => s.updateAthlete);
  const showToast = useUiStore((s) => s.showToast);
  const [saved, setSaved] = useState(false);

  if (!result) {
    return (
      <div className="msg" role="status" style={{ marginTop: 14 }}>
        No hay FTP estimado: hacen falta al menos {RAMP.minSteps} escalones completos con potencia
        (rodillo elegido en Ajustes y sensor de velocidad conectado).
      </div>
    );
  }

  const save = () => {
    void updateAthlete({ ftp: { watts: result.ftpW, source: 'ramp', dateMs: Date.now() } });
    setSaved(true);
    showToast(`FTP guardado: ${result.ftpW} W`);
  };

  return (
    <div className="card ramp-result" style={{ marginTop: 14 }}>
      <div className="row1">
        <h3>
          FTP estimado
          {simulated && <span className="sim-tag">SIMULADO</span>}
        </h3>
      </div>
      <div className="ramp-ftp num">
        {result.ftpW} <span>W</span>
      </div>
      <p>
        Mejor minuto: {Math.round(result.bestMinuteW)} W × {Math.round(RAMP.ftpFactor * 100)} % ={' '}
        {result.ftpW} W. Potencia estimada con la curva del rodillo.
        {simulated && ' Con datos simulados: no es tu FTP real.'}
      </p>
      <p className="num">
        Zonas:{' '}
        {powerZones(result.ftpW)
          .map((z) => `${z.id} ${z.maxW === null ? `${z.minW}+` : `${z.minW}–${z.maxW}`}`)
          .join(' · ')}{' '}
        W
      </p>
      <div className="actions">
        <button type="button" className="btn primary" disabled={saved} onClick={save}>
          {saved ? 'Guardado como tu FTP' : 'Guardar como mi FTP'}
        </button>
      </div>
    </div>
  );
}
