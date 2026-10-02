import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { BUILTIN_WORKOUTS } from '../domain/workout/library';
import { storage } from '../storage/repositories';
import { defaultSettings } from '../storage/settings';
import { useHistoryStore } from './historyStore';
import { loadAll } from './loadAll';
import { useSettingsStore } from './settingsStore';
import { useWorkoutsStore } from './workoutsStore';

/** Forgets the in-memory state, as if the page had been reloaded. */
function reload() {
  useSettingsStore.setState({ settings: defaultSettings(), loaded: false });
  useWorkoutsStore.setState({ custom: [], loaded: false });
  useHistoryStore.setState({ sessions: [], loaded: false });
  return loadAll();
}

beforeEach(async () => {
  await storage.clearHistory();
  for (const w of await storage.listWorkouts()) await storage.deleteWorkout(w.id);
  await storage.saveSettings(defaultSettings());
  await reload();
});

describe('stores persist through IndexedDB', () => {
  it('keeps settings changes after a reload', async () => {
    await useSettingsStore.getState().updateAthlete({ weightKg: 66 });
    await useSettingsStore.getState().update({ beeps: false });
    await reload();
    const { settings, loaded } = useSettingsStore.getState();
    expect(loaded).toBe(true);
    expect(settings.athlete.weightKg).toBe(66);
    expect(settings.beeps).toBe(false);
  });

  it('adds, replaces and removes custom workouts', async () => {
    const base = BUILTIN_WORKOUTS[1];
    if (!base) throw new Error('library is empty');
    const { save, remove } = useWorkoutsStore.getState();

    await save({ ...base, id: 'c-1' });
    await save({ ...base, id: 'c-1', name: 'Renombrada' });
    await reload();
    expect(useWorkoutsStore.getState().custom.map((w) => w.name)).toEqual(['Renombrada']);

    await remove('c-1');
    await reload();
    expect(useWorkoutsStore.getState().custom).toEqual([]);
  });
});
