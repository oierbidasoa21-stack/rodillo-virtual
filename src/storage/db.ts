import { Dexie, type EntityTable } from 'dexie';
import type { SessionSummary } from '../domain/metrics/summary';
import { migrateWorkout } from '../domain/workout/migrate';
import type { Workout } from '../domain/workout/types';
import type { AppSettings } from './settings';

/** Settings are a single row with a fixed key. */
export const SETTINGS_KEY = 'app';
export type SettingsRow = AppSettings & { key: typeof SETTINGS_KEY };

const STORES = {
  workouts: 'id',
  history: 'id, dateMs',
  settings: 'key',
};

export class RodilloDb extends Dexie {
  workouts!: EntityTable<Workout, 'id'>;
  history!: EntityTable<SessionSummary, 'id'>;
  settings!: EntityTable<SettingsRow, 'key'>;

  constructor(name = 'rodillo-virtual') {
    super(name);
    this.version(1).stores(STORES);
    // v2 (phase 4): blocks have `target` instead of `zoneId`. Same indexes; data rewritten.
    this.version(2)
      .stores(STORES)
      .upgrade((tx) =>
        tx
          .table('workouts')
          .toCollection()
          .modify((stored: unknown, ctx: { value?: unknown }) => {
            const migrated = migrateWorkout(stored);
            if (migrated) ctx.value = migrated;
            else delete ctx.value;
          }),
      );
  }
}
