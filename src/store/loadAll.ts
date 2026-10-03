import { useHistoryStore } from './historyStore';
import { useRoutesStore } from './routesStore';
import { useSettingsStore } from './settingsStore';
import { useWorkoutsStore } from './workoutsStore';

/** Loads every persisted store from IndexedDB. Call once at startup. */
export async function loadAll(): Promise<void> {
  await Promise.all([
    useSettingsStore.getState().load(),
    useWorkoutsStore.getState().load(),
    useHistoryStore.getState().load(),
    useRoutesStore.getState().load(),
  ]);
}
