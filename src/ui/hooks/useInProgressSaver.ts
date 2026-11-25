import { useEffect, useRef } from 'react';
import type { SessionSnapshot } from '../../recording/session';
import { storage } from '../../storage/repositories';

const SAVE_EVERY_MS = 10_000;

/**
 * Saves the session in progress every 10 s, when it pauses, and when the tab is
 * hidden or closed, so it can be recovered. `active` is false before the first
 * start and after the end.
 */
export function useInProgressSaver(
  active: boolean,
  running: boolean,
  build: () => SessionSnapshot,
) {
  const buildRef = useRef(build);
  useEffect(() => {
    buildRef.current = build;
  });

  const save = () => {
    void storage.saveInProgress(buildRef.current()).catch(() => undefined);
  };

  useEffect(() => {
    if (!active) return;
    const id = setInterval(save, SAVE_EVERY_MS);
    const onHide = () => {
      if (document.visibilityState === 'hidden') save();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', save);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', save);
    };
  }, [active]);

  // Pausing is a natural moment to step away: save right then.
  useEffect(() => {
    if (active && !running) save();
  }, [active, running]);
}
