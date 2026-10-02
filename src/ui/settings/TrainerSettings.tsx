import { TRAINER_CURVES, curveFor, trainerPowerW } from '../../domain/trainer/curves';
import { FTP_RANGE_W } from '../../domain/zones/athleteConfig';
import { powerZones } from '../../domain/zones/powerZones';
import { useSettingsStore } from '../../store/settingsStore';
import NumberInput from '../NumberInput';

const dateFormat = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' });
const round = (w: number) => Math.round(w);

/** Trainer curve for estimated power, FTP and power zones. */
export default function TrainerSettings() {
  const trainer = useSettingsStore((s) => s.settings.trainer);
  const ftp = useSettingsStore((s) => s.settings.athlete.ftp);
  const update = useSettingsStore((s) => s.update);
  const updateAthlete = useSettingsStore((s) => s.updateAthlete);
  const curve = curveFor(trainer);
  const listed = TRAINER_CURVES.find((c) => c.id === trainer.modelId);

  return (
    <div className="card">
      <div className="field">
        <label htmlFor="trainer">Rodillo</label>
        <select
          id="trainer"
          value={trainer.modelId}
          onChange={(e) => void update({ trainer: { ...trainer, modelId: e.target.value } })}
        >
          <option value="none">Ninguno (sin potencia)</option>
          {TRAINER_CURVES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="custom">Personalizada</option>
        </select>
      </div>

      {listed && <p className="note">Curva: {listed.source}.</p>}

      {trainer.modelId === 'custom' && (
        <div className="field">
          <label htmlFor="curve-a">P = a·v + b·v³ (v en km/h)</label>
          a
          <NumberInput
            id="curve-a"
            step="any"
            inputMode="decimal"
            value={trainer.customA}
            onCommit={(a) => void update({ trainer: { ...trainer, customA: a } })}
          />
          b
          <NumberInput
            id="curve-b"
            step="any"
            inputMode="decimal"
            style={{ width: 90 }}
            value={trainer.customB}
            onCommit={(b) => void update({ trainer: { ...trainer, customB: b } })}
          />
        </div>
      )}

      {curve ? (
        <p className="note num">
          Con esta curva: 20 km/h ≈ {round(trainerPowerW(curve, 20))} W · 30 km/h ≈{' '}
          {round(trainerPowerW(curve, 30))} W · 40 km/h ≈ {round(trainerPowerW(curve, 40))} W
          (estimado).
        </p>
      ) : (
        <p className="note">
          Sin rodillo elegido la app no muestra potencia: necesita la curva de tu rodillo para
          estimarla a partir de la velocidad de rueda.
        </p>
      )}

      <div className="field">
        <label htmlFor="ftp">FTP</label>
        <NumberInput
          id="ftp"
          min={FTP_RANGE_W.min}
          max={FTP_RANGE_W.max}
          placeholder="Sin FTP"
          value={ftp?.watts ?? null}
          onCommit={(w) => {
            if (w < FTP_RANGE_W.min || w > FTP_RANGE_W.max) return;
            void updateAthlete({
              ftp: { watts: Math.round(w), source: 'manual', dateMs: Date.now() },
            });
          }}
          onClear={() => void updateAthlete({ ftp: null })}
        />
        W
        {ftp && (
          <span className="note">
            {ftp.source === 'ramp' ? 'Estimado con ramp test' : 'Introducido a mano'}
            {ftp.dateMs > 0 && ` · ${dateFormat.format(ftp.dateMs)}`}
          </span>
        )}
      </div>

      {ftp ? (
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Zona</th>
                <th>Nombre</th>
                <th>Vatios</th>
              </tr>
            </thead>
            <tbody>
              {powerZones(ftp.watts).map((z) => (
                <tr key={z.id}>
                  <td>
                    <b>{z.id}</b>
                  </td>
                  <td>{z.name}</td>
                  <td className="num nowrap">
                    {z.maxW === null ? `${z.minW}+ W` : `${z.minW}–${z.maxW} W`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="note" style={{ margin: 0 }}>
          Sin FTP, las sesiones por potencia muestran el % pero no los vatios. Haz un ramp test
          (Sesiones) o escríbelo aquí.
        </p>
      )}
    </div>
  );
}
