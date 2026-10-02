import type { SessionSummary } from '../domain/metrics/summary';
import type { Workout } from '../domain/workout/types';
import { RodilloDb, SETTINGS_KEY } from './db';
import { type AppSettings, normalizeSettings } from './settings';

/** Data access for the app. Takes the database so tests can use a throwaway one. */
export function createStorage(db: RodilloDb) {
  return {
    listWorkouts: (): Promise<Workout[]> => db.workouts.toArray(),
    saveWorkout: async (workout: Workout): Promise<void> => {
      await db.workouts.put(workout);
    },
    deleteWorkout: (id: string): Promise<void> => db.workouts.delete(id),

    /** Oldest first. */
    listHistory: (): Promise<SessionSummary[]> => db.history.orderBy('dateMs').toArray(),
    addHistory: async (entry: SessionSummary): Promise<void> => {
      await db.history.put(entry);
    },
    clearHistory: (): Promise<void> => db.history.clear(),

    getSettings: async (): Promise<AppSettings> =>
      normalizeSettings(await db.settings.get(SETTINGS_KEY)),
    saveSettings: async (settings: AppSettings): Promise<void> => {
      await db.settings.put({ ...settings, key: SETTINGS_KEY });
    },
  };
}

export type Storage = ReturnType<typeof createStorage>;

/** The app's storage, backed by the browser's IndexedDB. */
export const storage: Storage = createStorage(new RodilloDb());
