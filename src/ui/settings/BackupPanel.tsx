import { useRef, useState } from 'react';
import {
  type ParsedBackup,
  backupFileName,
  exportBackup,
  importBackup,
  parseBackup,
} from '../../storage/backup';
import { storage } from '../../storage/repositories';
import { loadAll } from '../../store/loadAll';
import { useUiStore } from '../../store/uiStore';
import ConfirmButton from '../ConfirmButton';
import { downloadJson, readJsonFile } from '../download';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const dateFormat = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeStyle: 'short' });

/** Full export and import of workouts, history and settings. */
export default function BackupPanel() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ParsedBackup | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const showToast = useUiStore((s) => s.showToast);

  const exportAll = async () => {
    const now = Date.now();
    downloadJson(backupFileName(now), await exportBackup(storage, now));
  };

  const pick = async (file: File) => {
    setPending(null);
    const json = await readJsonFile(file);
    if (json === null) return setErrors(['El archivo no es un JSON válido.']);
    const result = parseBackup(json);
    if (!result.ok) return setErrors(result.errors);
    setErrors([]);
    setPending(result.value);
  };

  const restore = async () => {
    if (!pending) return;
    await importBackup(storage, pending.backup);
    await loadAll();
    setPending(null);
    showToast('Copia restaurada');
  };

  return (
    <>
      <div className="actions">
        <button type="button" className="btn" onClick={() => void exportAll()}>
          Exportar copia
        </button>
        <button type="button" className="btn ghost" onClick={() => fileInput.current?.click()}>
          Importar copia
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void pick(file);
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

      {pending && (
        <div className="msg" role="status">
          <p style={{ margin: '0 0 6px' }}>
            Copia
            {pending.backup.exportedAtMs > 0 &&
              ` del ${dateFormat.format(pending.backup.exportedAtMs)}`}
            : {plural(pending.backup.workouts.length, 'sesión propia', 'sesiones propias')},{' '}
            {plural(pending.backup.history.length, 'entrada de historial', 'entradas de historial')}{' '}
            y los ajustes (peso, zonas y demás).
          </p>
          {(pending.skipped.workouts > 0 || pending.skipped.history > 0) && (
            <p style={{ margin: '0 0 6px' }}>
              No se pueden leer {plural(pending.skipped.workouts, 'sesión', 'sesiones')} y{' '}
              {plural(pending.skipped.history, 'entrada de historial', 'entradas de historial')} del
              archivo; se quedarán fuera.
            </p>
          )}
          <p style={{ margin: '0 0 8px' }}>
            <b>Reemplazará todo lo guardado en este navegador.</b> Si tienes algo que no quieras
            perder, exporta antes una copia.
          </p>
          <div className="actions">
            <ConfirmButton
              label="Reemplazar mis datos"
              className="btn primary"
              onConfirm={() => void restore()}
            />
            <button type="button" className="btn ghost" onClick={() => setPending(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <p className="note" style={{ margin: 0 }}>
        La copia incluye tus datos personales (peso, zonas y entrenamientos). Guárdala fuera del
        repositorio, por ejemplo en la carpeta <code>data/</code>.
      </p>
    </>
  );
}
