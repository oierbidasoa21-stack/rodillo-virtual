import type { ThemePreference } from '../../storage/settings';
import { defaultSettings } from '../../storage/settings';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';
import ConfirmButton from '../ConfirmButton';
import NumberInput from '../NumberInput';
import AthleteFile from './AthleteFile';
import ZonesTable from './ZonesTable';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const THEMES: { id: ThemePreference; label: string }[] = [
  { id: 'system', label: 'Como el sistema' },
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' },
];

export default function SettingsView() {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const updateAthlete = useSettingsStore((s) => s.updateAthlete);
  const showToast = useUiStore((s) => s.showToast);
  const { athlete } = settings;

  return (
    <>
      <div className="sectionhead">
        <h2>Tus datos</h2>
      </div>
      <div className="card">
        <div className="field">
          <label htmlFor="weight">Peso</label>
          <NumberInput
            id="weight"
            min={30}
            max={200}
            value={athlete.weightKg}
            onCommit={(v) => void updateAthlete({ weightKg: clamp(v, 30, 200) })}
          />
          kg
        </div>
        <div className="field">
          <label htmlFor="bike">Peso de la bici</label>
          <NumberInput
            id="bike"
            min={0}
            max={40}
            value={athlete.bikeWeightKg}
            onCommit={(v) => void updateAthlete({ bikeWeightKg: clamp(v, 0, 40) })}
          />
          kg
        </div>
        <div className="field">
          <label htmlFor="voice">Avisos por voz</label>
          <input
            id="voice"
            type="checkbox"
            checked={settings.voice}
            onChange={(e) => void update({ voice: e.target.checked })}
          />
        </div>
        <div className="field">
          <label htmlFor="beeps">Pitidos</label>
          <input
            id="beeps"
            type="checkbox"
            checked={settings.beeps}
            onChange={(e) => void update({ beeps: e.target.checked })}
          />
        </div>
        <div className="field">
          <label htmlFor="theme">Tema</label>
          <select
            id="theme"
            value={settings.theme}
            onChange={(e) => {
              const theme = THEMES.find((t) => t.id === e.target.value);
              if (theme) void update({ theme: theme.id });
            }}
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="sectionhead">
        <h2>Zonas de pulso</h2>
        <ConfirmButton
          label="Valores de ejemplo"
          className="btn ghost"
          onConfirm={() => {
            void updateAthlete({ hrZonesPer10s: defaultSettings().athlete.hrZonesPer10s });
            showToast('Zonas de ejemplo restablecidas');
          }}
        />
      </div>
      <div className="card">
        <ZonesTable
          key={JSON.stringify(athlete.hrZonesPer10s)}
          zones={athlete.hrZonesPer10s}
          onSave={(zones) => void updateAthlete({ hrZonesPer10s: zones })}
        />
      </div>

      <div className="sectionhead">
        <h2>Archivo del atleta</h2>
      </div>
      <div className="card">
        <AthleteFile
          athlete={athlete}
          onImport={(value) => {
            void updateAthlete(value);
            showToast('Peso y zonas importados');
          }}
        />
      </div>

      <div className="sectionhead">
        <h2>Cómo se calcula</h2>
      </div>
      <div className="card note">
        <p>
          <b>Carga</b>: minutos en cada zona multiplicados por un peso (L1 1, L2 2, L3 3, UA 4, UA+
          5, VO2 6). Sirve para comparar sesiones entre sí, al estilo del TRIMP.
        </p>
        <p>
          <b>kcal</b>: MET de cada zona × peso × horas. Es una estimación con un margen de ±20 %.
        </p>
        <p>
          Sin pulsómetro, el tiempo en zona sale de los bloques que has hecho, no de tu pulso real.
        </p>
      </div>
    </>
  );
}
