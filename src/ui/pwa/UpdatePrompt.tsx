import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useUiStore } from '../../store/uiStore';
import { shouldShowUpdatePrompt } from './updatePolicy';

const CHECK_EVERY_MS = 60 * 60 * 1000;

/** Checks for a new version now, without failing when offline. */
function checkForUpdate(registration: ServiceWorkerRegistration): void {
  if (navigator.onLine) registration.update().catch(() => undefined);
}

/**
 * Registers the service worker and offers new versions with a bar at the bottom.
 * It never reloads by itself, and stays hidden while a session plays or the
 * editor is open.
 */
export default function UpdatePrompt() {
  const playing = useUiStore((s) => s.playing !== null);
  const editing = useUiStore((s) => s.editing !== null);
  const showToast = useUiStore((s) => s.showToast);
  const [dismissed, setDismissed] = useState(false);

  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => checkForUpdate(registration), CHECK_EVERY_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate(registration);
      });
    },
    onRegisterError(error: unknown) {
      console.error('Service worker registration failed', error);
    },
  });

  useEffect(() => {
    if (!offlineReady) return;
    showToast('Lista para usar sin conexión');
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady, showToast]);

  if (!shouldShowUpdatePrompt({ needRefresh, dismissed, playing, editing })) return null;
  return (
    <div className="update-bar" role="status">
      <span>Nueva versión disponible</span>
      <span className="actions">
        <button type="button" className="btn ghost" onClick={() => setDismissed(true)}>
          Más tarde
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={() => void updateServiceWorker(true)}
        >
          Actualizar
        </button>
      </span>
    </div>
  );
}
