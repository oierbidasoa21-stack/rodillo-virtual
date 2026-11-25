import { useEffect, useState } from 'react';
import { type SessionSummary, hasKcal } from '../../domain/metrics/summary';
import type { SessionRecording } from '../../recording/session';
import { buildTcx, tcxFileName } from '../../recording/tcx';
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
  const simulated = !!(summary.hrMeasured?.simulated || summary.power?.simulated);

  const exportTcx = () => {
    if (!recording) return;
    const tcx = buildTcx({
      name: summary.workoutName,
      startMs: recording.startMs,
      samples: recording.samples,
      kcal: hasKcal(summary) ? summary.kcalEstimated : null,
      powerEstimated,
      simulated,
    });
    downloadText(
      tcxFileName(recording.startMs, summary.workoutName),
      tcx,
      'application/vnd.garmin.tcx+xml',
    );
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
