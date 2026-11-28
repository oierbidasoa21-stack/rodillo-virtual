import { MIN_SAVED_SESSION_SEC, type SessionSummary } from '../../domain/metrics/summary';
import type { RecorderState } from '../../recording/recorder';
import { recordingOf } from '../../recording/session';
import { isSimulatedSession, sessionFile } from '../../recording/sessionFile';
import { storage } from '../../storage/repositories';
import { useHistoryStore } from '../../store/historyStore';
import { useSettingsStore } from '../../store/settingsStore';
import { downloadText } from '../download';

/**
 * Saves a finished session with its samples, if it is long enough, and forgets
 * the session in progress. Returns whether it was saved.
 */
export function saveFinishedSession(summary: SessionSummary, recorder: RecorderState): boolean {
  const saved = summary.durationSec >= MIN_SAVED_SESSION_SEC;
  void (async () => {
    if (saved) {
      await useHistoryStore.getState().add(summary);
      await storage.saveRecording(recordingOf(summary.id, recorder));
    }
    await storage.clearInProgress();
  })().catch((error: unknown) => console.error(error));
  return saved;
}

/**
 * After a session is saved: with «Descargar el archivo al guardar» on, downloads
 * its file for Strava. Never for a session with simulated readings. Returns the
 * file name, or null if nothing was downloaded.
 */
export function downloadOnSave(
  summary: SessionSummary,
  recorder: RecorderState,
  saved: boolean,
): string | null {
  if (!saved || isSimulatedSession(summary)) return null;
  if (!useSettingsStore.getState().settings.downloadOnSave) return null;
  const file = sessionFile(summary, recorder.recording);
  downloadText(file.fileName, file.content, file.type);
  return file.fileName;
}
