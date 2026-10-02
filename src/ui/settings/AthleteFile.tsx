import { useRef, useState } from 'react';
import { type AthleteConfig, parseAthleteConfig } from '../../domain/zones/athleteConfig';
import { downloadJson, readJsonFile } from '../download';

interface Props {
  athlete: AthleteConfig;
  onImport: (athlete: AthleteConfig) => void;
}

/** Import and export of athlete.json (weight and zones), same format as config/. */
export default function AthleteFile({ athlete, onImport }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const importFile = async (file: File) => {
    const json = await readJsonFile(file);
    if (json === null) {
      setErrors(['El archivo no es un JSON válido.']);
      return;
    }
    const result = parseAthleteConfig(json);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    onImport(result.value);
  };

  const exportFile = () => downloadJson('athlete.json', athlete);

  return (
    <>
      <div className="actions">
        <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
          Importar athlete.json
        </button>
        <button type="button" className="btn ghost" onClick={exportFile}>
          Exportar
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void importFile(file);
          }}
        />
      </div>
      {errors.length > 0 && (
        <div className="msg error" role="alert">
          <p style={{ margin: '0 0 4px' }}>No se ha importado nada:</p>
          <ul>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="note">
        Carga tu <code>config/athlete.local.json</code> para poner tu peso y tus zonas en este
        dispositivo. Se guarda solo en este navegador.
      </p>
    </>
  );
}
