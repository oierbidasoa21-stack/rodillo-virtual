import { useEffect, useState } from 'react';
import {
  type SessionSnapshot,
  snapshotElapsedSec,
  snapshotName,
  summaryFromSnapshot,
} from '../../recording/session';
import { storage } from '../../storage/repositories';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';
import ConfirmButton from '../ConfirmButton';
import { formatClock } from '../format';
import { saveFinishedSession } from './saveSession';

const dateFormat = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Offers to continue, save or discard a session left unfinished (a closed tab,
 * a crash, a power cut). Shown on the main screen until the rider decides.
 */
export default function ResumeBanner() {
  const [snap, setSnap] = useState<SessionSnapshot | null>(null);
  const startWorkout = useUiStore((s) => s.startWorkout);
  const startRide = useUiStore((s) => s.startRide);
  const showToast = useUiStore((s) => s.showToast);

  useEffect(() => {
    let alive = true;
    storage
      .getInProgress()
      .then((s) => {
        if (alive && s) setSnap(s);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  if (!snap) return null;

  const resume = () => {
    if (snap.kind === 'workout') startWorkout(snap.workout, snap.playMode, snap.route, snap);
    else startRide(snap.route, snap.mode, snap);
  };

  const save = () => {
    const { settings } = useSettingsStore.getState();
    const summary = summaryFromSnapshot(snap, {
      id: crypto.randomUUID(),
      dateMs: snap.recorder.recording.startMs,
      weightKg: settings.athlete.weightKg,
      ftpW: settings.athlete.ftp?.watts ?? null,
    });
    const saved = saveFinishedSession(summary, snap.recorder);
    showToast(saved ? 'Sesión guardada en el historial' : 'Menos de 1 minuto: no se guarda');
    setSnap(null);
  };

  const discard = () => {
    void storage.clearInProgress().catch(() => undefined);
    setSnap(null);
  };

  return (
    <div className="msg resume-banner" role="status">
      <span>
        <b>Sesión sin terminar:</b> {snapshotName(snap)} ·{' '}
        <span className="num">{formatClock(snapshotElapsedSec(snap))}</span> ·{' '}
        {dateFormat.format(snap.savedAtMs)}
      </span>
      <span className="actions">
        <button type="button" className="btn primary" onClick={resume}>
          Retomar
        </button>
        <button type="button" className="btn" onClick={save}>
          Guardar
        </button>
        <ConfirmButton label="Descartar" onConfirm={discard} />
      </span>
    </div>
  );
}
