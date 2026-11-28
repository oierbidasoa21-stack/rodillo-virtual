import { useEffect, useState } from 'react';
import type { SessionSummary } from '../../domain/metrics/summary';
import type { SessionRecording } from '../../recording/session';
import { STRAVA_UPLOAD_URL, isSimulatedSession, sessionFile } from '../../recording/sessionFile';
import { storage } from '../../storage/repositories';
import { useHistoryStore } from '../../store/historyStore';
import { useSettingsStore } from '../../store/settingsStore';
import ConfirmButton from '../ConfirmButton';
import { downloadText } from '../download';
import Summary from '../player/Summary';
import SessionCharts from './SessionCharts';

/** A saved session: its summary, charts of what was recorded, TCX export and delete. */
export default function SessionDetail({
  summary,
  onClose,
}: {
  summary: SessionSummary;
  onClose: () => void;
}) {
  const zones = useSettingsStore((s) => s.settings.athlete.hrZonesPer10s);
  const remove = useHistoryStore((s) => s.remove);
  // undefined while loading, null when the session has no recording.
  const [recording, setRecording] = useState<SessionRecording | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    storage
      .getRecording(summary.id)
      .then((r) => {
        if (alive) setRecording(r ?? null);
      })
      .catch(() => {
        if (alive) setRecording(null);
      });
    return () => {
      alive = false;
    };
  }, [summary.id]);

  // Power on this trainer always comes from a speed curve.
  const powerEstimated = true;
  const simulated = isSimulatedSession(summary);

  const exportTcx = () => {
    if (!recording) return;
    const f = sessionFile(summary, recording);
    downloadText(f.fileName, f.content, f.type);
  };

  return (
    <div className="overlay">
      <Summary
        summary={summary}
        saved
        onClose={onClose}
        closeLabel="Volver al historial"
        footer={
          recording === null ? (
            <p className="note">
              Esta sesión es anterior a la grabación segundo a segundo: solo queda su resumen.
            </p>
          ) : recording ? (
            <SessionCharts
              samples={recording.samples}
              zones={zones}
              powerEstimated={powerEstimated}
              simulated={simulated}
            />
          ) : null
        }
      >
        <div className="detail-actions">
          <button
            type="button"
            className="btn primary"
            disabled={!recording?.samples.length}
            title={recording ? undefined : 'Esta sesión no tiene grabación'}
            onClick={exportTcx}
          >
            Exportar TCX
          </button>
          {!simulated && recording?.samples.length ? (
            <a
              className="btn"
              href={STRAVA_UPLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Abre la página de subida de Strava: elige ahí el archivo exportado"
            >
              Abrir Strava para subir
            </a>
          ) : null}
          <ConfirmButton
            label="Borrar sesión"
            onConfirm={() => {
              void remove(summary.id);
              onClose();
            }}
          />
        </div>
      </Summary>
    </div>
  );
}
