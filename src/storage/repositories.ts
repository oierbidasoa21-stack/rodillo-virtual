import type { SessionSummary } from '../domain/metrics/summary';
import type { Route } from '../domain/route/route';
import { migrateWorkout } from '../domain/workout/migrate';
import type { Workout } from '../domain/workout/types';
import { RodilloDb, SETTINGS_KEY } from './db';
import { type AppSettings, normalizeSettings } from './settings';

/** Data access for the app. Takes the database so tests can use a throwaway one. */
export function createStorage(db: RodilloDb) {
  return {
    /** Normalised on read too, so a half-migrated or hand-edited row can't break the app. */
    listWorkouts: async (): Promise<Workout[]> =>
      (await db.workouts.toArray()).map(migrateWorkout).filter((w): w is Workout => w !== null),
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

    listRoutes: (): Promise<Route[]> => db.routes.toArray(),
    saveRoute: async (route: Route): Promise<void> => {
      await db.routes.put(route);
    },
    deleteRoute: (id: string): Promise<void> => db.routes.delete(id),

    getSettings: async (): Promise<AppSettings> =>
      normalizeSettings(await db.settings.get(SETTINGS_KEY)),
    saveSettings: async (settings: AppSettings): Promise<void> => {
      await db.settings.put({ ...settings, key: SETTINGS_KEY });
    },

    /** Replaces everything in one transaction: all of it lands, or nothing changes. */
    replaceAll: async (data: {
      workouts: Workout[];
      history: SessionSummary[];
      settings: AppSettings;
      routes: Route[];
    }): Promise<void> => {
      const tables = [db.workouts, db.history, db.settings, db.routes];
      await db.transaction('rw', tables, async () => {
        await Promise.all(tables.map((t) => t.clear()));
        await db.workouts.bulkPut(data.workouts);
        await db.history.bulkPut(data.history);
        await db.routes.bulkPut(data.routes);
        await db.settings.put({ ...data.settings, key: SETTINGS_KEY });
      });
    },
  };
}

export type Storage = ReturnType<typeof createStorage>;

/** The app's storage, backed by the browser's IndexedDB. */
export const storage: Storage = createStorage(new RodilloDb());
