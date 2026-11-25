import type { SessionSummary } from '../domain/metrics/summary';
import type { Route } from '../domain/route/route';
import { migrateWorkout } from '../domain/workout/migrate';
import type { Workout } from '../domain/workout/types';
import type { SessionRecording, SessionSnapshot } from '../recording/session';
import { IN_PROGRESS_KEY, RodilloDb, SETTINGS_KEY } from './db';
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
    /** Clears the history and its recordings. */
    clearHistory: async (): Promise<void> => {
      await db.transaction('rw', [db.history, db.recordings], async () => {
        await Promise.all([db.history.clear(), db.recordings.clear()]);
      });
    },
    /** Deletes one history entry and its recording. */
    deleteSession: async (id: string): Promise<void> => {
      await db.transaction('rw', [db.history, db.recordings], async () => {
        await Promise.all([db.history.delete(id), db.recordings.delete(id)]);
      });
    },

    saveRecording: async (recording: SessionRecording): Promise<void> => {
      await db.recordings.put(recording);
    },
    getRecording: (sessionId: string): Promise<SessionRecording | undefined> =>
      db.recordings.get(sessionId),
    listRecordings: (): Promise<SessionRecording[]> => db.recordings.toArray(),

    getInProgress: async (): Promise<SessionSnapshot | undefined> => {
      const row = await db.inProgress.get(IN_PROGRESS_KEY);
      if (!row) return undefined;
      const { key: _key, ...snapshot } = row;
      void _key;
      return snapshot as SessionSnapshot;
    },
    saveInProgress: async (snapshot: SessionSnapshot): Promise<void> => {
      await db.inProgress.put({ ...snapshot, key: IN_PROGRESS_KEY });
    },
    clearInProgress: (): Promise<void> => db.inProgress.delete(IN_PROGRESS_KEY),

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
      recordings: SessionRecording[];
    }): Promise<void> => {
      const tables = [db.workouts, db.history, db.settings, db.routes, db.recordings];
      await db.transaction('rw', tables, async () => {
        await Promise.all(tables.map((t) => t.clear()));
        await db.workouts.bulkPut(data.workouts);
        await db.history.bulkPut(data.history);
        await db.routes.bulkPut(data.routes);
        await db.recordings.bulkPut(data.recordings);
        await db.settings.put({ ...data.settings, key: SETTINGS_KEY });
      });
    },
  };
}

export type Storage = ReturnType<typeof createStorage>;

/** The app's storage, backed by the browser's IndexedDB. */
export const storage: Storage = createStorage(new RodilloDb());
