import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SessionSummary } from '../domain/metrics/summary';
import { emptySecByZone } from '../domain/metrics/timeInZone';
import { BUILTIN_WORKOUTS } from '../domain/workout/library';
import { RodilloDb, SETTINGS_KEY } from './db';
import { type Storage, createStorage } from './repositories';
import { defaultSettings } from './settings';

let db: RodilloDb;
let storage: Storage;

beforeEach(() => {
  db = new RodilloDb(`test-${crypto.randomUUID()}`);
  storage = createStorage(db);
});

afterEach(async () => {
  await db.delete();
});

const summary = (id: string, dateMs: number): SessionSummary => ({
  id,
  dateMs,
  workoutName: 'Fondo',
  durationSec: 3600,
  load: 100,
  kcalEstimated: 500,
  plannedSecByZone: emptySecByZone(),
  actualSecByZone: emptySecByZone(),
  counts: [{ atSec: 60, valuePer10s: 25, targetZoneId: 'L3', status: 'in' }],
});

describe('workouts', () => {
  it('saves, updates, lists and deletes custom workouts', async () => {
    const base = BUILTIN_WORKOUTS[0];
    if (!base) throw new Error('library is empty');
    const mine = { ...base, id: 'c-1', name: 'Mía' };

    await storage.saveWorkout(mine);
    await storage.saveWorkout({ ...mine, name: 'Mía v2' });
    expect(await storage.listWorkouts()).toEqual([{ ...mine, name: 'Mía v2' }]);

    await storage.deleteWorkout('c-1');
    expect(await storage.listWorkouts()).toEqual([]);
  });
});

describe('history', () => {
  it('lists sessions oldest first and clears them', async () => {
    await storage.addHistory(summary('b', 2000));
    await storage.addHistory(summary('a', 1000));
    expect((await storage.listHistory()).map((s) => s.id)).toEqual(['a', 'b']);
    expect((await storage.listHistory())[0]?.counts).toHaveLength(1);

    await storage.clearHistory();
    expect(await storage.listHistory()).toEqual([]);
  });
});

describe('settings', () => {
  it('returns defaults (the example athlete) when nothing is stored', async () => {
    const settings = await storage.getSettings();
    expect(settings).toEqual(defaultSettings());
    expect(settings.athlete.weightKg).toBe(70);
  });

  it('round-trips saved settings', async () => {
    const custom = { ...defaultSettings(), voice: false, theme: 'dark' as const };
    custom.athlete = { ...custom.athlete, weightKg: 65 };
    await storage.saveSettings(custom);
    expect(await storage.getSettings()).toEqual(custom);
  });

  it('repairs missing or invalid fields from an older record', async () => {
    await db.settings.put({ key: SETTINGS_KEY, beeps: false } as never);
    const settings = await storage.getSettings();
    expect(settings.beeps).toBe(false);
    expect(settings.voice).toBe(true);
    expect(settings.simulateSensors).toBe(false);
    expect(settings.athlete).toEqual(defaultSettings().athlete);
  });
});
