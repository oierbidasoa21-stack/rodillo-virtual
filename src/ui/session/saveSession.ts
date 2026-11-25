import { MIN_SAVED_SESSION_SEC, type SessionSummary } from '../../domain/metrics/summary';
import type { RecorderState } from '../../recording/recorder';
import { recordingOf } from '../../recording/session';
import { storage } from '../../storage/repositories';
import { useHistoryStore } from '../../store/historyStore';

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
