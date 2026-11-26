import { useEffect, useRef, useState } from 'react';

/** Keys typed into these should never toggle full screen. */
const TYPING = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Full screen for one element (the whole session screen, so the HUD and the
 * controls stay visible). The F key toggles it; Esc leaves, as usual.
 */
export function useFullscreen<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [active, setActive] = useState(false);
  const supported = typeof document !== 'undefined' && document.fullscreenEnabled;

  const toggle = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void ref.current?.requestFullscreen().catch(() => undefined);
  };

  useEffect(() => {
    const onChange = () => setActive(document.fullscreenElement === ref.current);
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'f' || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (TYPING.has(target.tagName) || target.isContentEditable)) return;
      e.preventDefault();
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
      else void ref.current?.requestFullscreen().catch(() => undefined);
    };
    document.addEventListener('fullscreenchange', onChange);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      window.removeEventListener('keydown', onKey);
      // Leaving the screen (session closed) also leaves full screen.
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    };
  }, []);

  return { ref, active, toggle, supported };
}
