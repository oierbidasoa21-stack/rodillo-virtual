import { useEffect, useState } from 'react';
import { requestPersistentStorage } from '../storage/persist';
import { watchSimulationSetting } from '../sensors/manager';
import { loadAll } from '../store/loadAll';
import { useUiStore } from '../store/uiStore';
import EditorSheet from './editor/EditorSheet';
import HistoryView from './history/HistoryView';
import { useTheme } from './hooks/useTheme';
import Player from './player/Player';
import UpdatePrompt from './pwa/UpdatePrompt';
import SensorChips from './sensors/SensorChips';
import SensorsView from './sensors/SensorsView';
import SettingsView from './settings/SettingsView';
import Tabs from './Tabs';
import Toast from './Toast';
import LibraryView from './library/LibraryView';
import ZoneStrip from './ZoneStrip';

export default function App() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const tab = useUiStore((s) => s.tab);
  const editing = useUiStore((s) => s.editing);
  const playing = useUiStore((s) => s.playing);
  useTheme();

  useEffect(() => {
    loadAll()
      .then(() => {
        setStatus('ready');
        watchSimulationSetting();
        void requestPersistentStorage().then(useUiStore.getState().setStoragePersistence);
      })
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
          {status === 'ready' && <SensorChips />}
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
              {tab === 'history' && <HistoryView />}
              {tab === 'sensors' && <SensorsView />}
              {tab === 'settings' && <SettingsView />}
            </main>
          </>
        )}
      </div>
      {editing && <EditorSheet key={editing.id ?? 'new'} initial={editing} />}
      {playing && <Player key={playing.id} workout={playing} />}
      <UpdatePrompt />
      <Toast />
    </>
  );
}
