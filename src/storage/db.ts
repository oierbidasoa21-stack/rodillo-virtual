import { Dexie, type EntityTable } from 'dexie';
import type { SessionSummary } from '../domain/metrics/summary';
import type { TrainingPlan } from '../domain/plan/plan';
import type { Route } from '../domain/route/route';
import { migrateWorkout } from '../domain/workout/migrate';
import { migrateLegacyZoneIds } from '../domain/zones/legacy';
import type { Workout } from '../domain/workout/types';
import type { SessionRecording, SessionSnapshot } from '../recording/session';
import type { AppSettings } from './settings';

/** Settings are a single row with a fixed key. */
export const SETTINGS_KEY = 'app';
export type SettingsRow = AppSettings & { key: typeof SETTINGS_KEY };

/**
 * A GPX route whose real landscape (phase 10) was downloaded. The tiles
 * themselves live in Cache Storage (src/tiles); this row only says what was
 * fetched and when.
 */
export interface RouteLandscape {
  routeId: string;
  downloadedAtMs: number;
  /** Tiles the landscape needs. */
  tiles: number;
  /** Tiles that could not be downloaded (those spots use the usual ground). */
  failed: number;
  /** Bytes downloaded the last time. */
  bytes: number;
}

/** The session in progress is a single row with a fixed key. */
export const IN_PROGRESS_KEY = 'current';
export type InProgressRow = SessionSnapshot & { key: typeof IN_PROGRESS_KEY };

const STORES_V1 = {
  workouts: 'id',
  history: 'id, dateMs',
  settings: 'key',
};

export class RodilloDb extends Dexie {
  workouts!: EntityTable<Workout, 'id'>;
  history!: EntityTable<SessionSummary, 'id'>;
  settings!: EntityTable<SettingsRow, 'key'>;
  /** Routes imported from GPX (built-in ones are generated, not stored). */
  routes!: EntityTable<Route, 'id'>;
  /** Second-by-second samples of each saved session, keyed by its history id. */
  recordings!: EntityTable<SessionRecording, 'sessionId'>;
  /** The session being ridden, saved every few seconds to survive a closed tab. */
  inProgress!: EntityTable<InProgressRow, 'key'>;
  /** Weekly plans imported from the coaching agent. */
  plans!: EntityTable<TrainingPlan, 'id'>;
  /** Which GPX routes have their real landscape downloaded. */
  landscapes!: EntityTable<RouteLandscape, 'routeId'>;

  constructor(name = 'rodillo-virtual') {
    super(name);
    this.version(1).stores(STORES_V1);
    // v2 (phase 4): blocks have `target` instead of `zoneId`. Same indexes; data rewritten.
    this.version(2)
      .stores(STORES_V1)
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
    // v3 (phase 5): imported routes.
    this.version(3).stores({ ...STORES_V1, routes: 'id' });
    // v4 (phase 6): recordings and the session in progress.
    this.version(4).stores({
      ...STORES_V1,
      routes: 'id',
      recordings: 'sessionId',
      inProgress: 'key',
    });
    // v5 (mejoras): training plans from the coaching agent.
    const STORES_V5 = {
      ...STORES_V1,
      routes: 'id',
      recordings: 'sessionId',
      inProgress: 'key',
      plans: 'id',
    };
    this.version(5).stores(STORES_V5);
    // v6 (phase 9): heart rate zones renamed L1…VO2 → Z1…Z6. Same indexes; data rewritten.
    // Routes and recordings carry no zones and are left alone.
    this.version(6)
      .stores(STORES_V5)
      .upgrade(async (tx) => {
        for (const table of ['workouts', 'history', 'settings', 'inProgress', 'plans']) {
          await tx
            .table(table)
            .toCollection()
            .modify((stored: unknown, ctx: { value?: unknown }) => {
              ctx.value = migrateLegacyZoneIds(stored);
            });
        }
      });
    // v7 (phase 10): which routes have their real landscape downloaded.
    this.version(7).stores({ ...STORES_V5, landscapes: 'routeId' });
  }
}
