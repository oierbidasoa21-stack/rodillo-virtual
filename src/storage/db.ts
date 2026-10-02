import { Dexie, type EntityTable } from 'dexie';
import type { SessionSummary } from '../domain/metrics/summary';
import type { Workout } from '../domain/workout/types';
import type { AppSettings } from './settings';

/** Settings are a single row with a fixed key. */
export const SETTINGS_KEY = 'app';
export type SettingsRow = AppSettings & { key: typeof SETTINGS_KEY };

export class RodilloDb extends Dexie {
  workouts!: EntityTable<Workout, 'id'>;
  history!: EntityTable<SessionSummary, 'id'>;
  settings!: EntityTable<SettingsRow, 'key'>;

  constructor(name = 'rodillo-virtual') {
    super(name);
    this.version(1).stores({
      workouts: 'id',
      history: 'id, dateMs',
      settings: 'key',
    });
  }
}
