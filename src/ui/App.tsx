import { useEffect, useState } from 'react';
import { loadAll } from '../store/loadAll';
import { useUiStore } from '../store/uiStore';
import { useTheme } from './hooks/useTheme';
import Tabs from './Tabs';
import Toast from './Toast';
import LibraryView from './library/LibraryView';
import ZoneStrip from './ZoneStrip';

export default function App() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const tab = useUiStore((s) => s.tab);
  useTheme();

  useEffect(() => {
    loadAll()
      .then(() => setStatus('ready'))
      .catch((error: unknown) => {
        console.error(error);
        setStatus('error');
      });
  }, []);

  return (
    <>
      <div className="wrap">
        <header className="top">
          <div>
            <h1>Rodillo Virtual</h1>
            <p>Sesiones por zonas de pulso, contadas en 10 segundos</p>
          </div>
        </header>
        {status === 'error' && (
          <p className="msg error" role="alert">
            No se pueden leer los datos guardados. Puede pasar en una ventana privada o si el
            navegador bloquea el almacenamiento de este sitio.
          </p>
        )}
        {status === 'ready' && (
          <>
            <Tabs />
            <ZoneStrip />
            <main>
              {tab === 'library' && <LibraryView />}
              {tab === 'history' && <p className="note">Historial</p>}
              {tab === 'settings' && <p className="note">Ajustes</p>}
            </main>
          </>
        )}
      </div>
      <Toast />
    </>
  );
}
