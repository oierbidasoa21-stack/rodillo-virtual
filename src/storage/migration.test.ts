import 'fake-indexeddb/auto';
import { Dexie } from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { makeBlock, makeRepeat } from '../domain/workout/types';
import { RodilloDb } from './db';
import { createStorage } from './repositories';

const name = `migration-${crypto.randomUUID()}`;

afterEach(async () => {
  await Dexie.delete(name);
});

describe('Dexie migrations', () => {
  it('rewrites stored workouts from zoneId blocks to targets', async () => {
    // A database exactly as phases 1–3 left it.
    const v1 = new Dexie(name);
    v1.version(1).stores({ workouts: 'id', history: 'id, dateMs', settings: 'key' });
    await v1.table('workouts').put({
      id: 'c-1',
      name: 'Umbral mía',
      description: '',
      blocks: [
        { type: 'block', durationSec: 600, zoneId: 'L1', kind: 'warm', note: '' },
        {
          type: 'repeat',
          times: 3,
          items: [{ type: 'block', durationSec: 600, zoneId: 'UA', kind: 'work', note: '' }],
        },
      ],
    });
    await v1.table('history').put({ id: 'h-1', dateMs: 1, workoutName: 'Umbral mía' });
    v1.close();

    const db = new RodilloDb(name);
    const storage = createStorage(db);
    const expected = [makeBlock(600, 'Z1', 'warm'), makeRepeat(3, [makeBlock(600, 'Z4', 'work')])];
    expect((await storage.listWorkouts())[0]?.blocks).toEqual(expected);
    // Rewritten on disk, not just on read
    expect((await db.workouts.get('c-1'))?.blocks).toEqual(expected);
    // Other tables untouched
    expect(await db.history.count()).toBe(1);
    expect(db.verno).toBe(7);
    expect(await db.routes.count()).toBe(0);
    db.close();
  });

  it('v2 → v3 adds the routes table and keeps everything else', async () => {
    const v2 = new Dexie(name);
    v2.version(2).stores({ workouts: 'id', history: 'id, dateMs', settings: 'key' });
    await v2.table('workouts').put({
      id: 'c-2',
      name: 'Ya migrada',
      description: '',
      blocks: [makeBlock(300, 'Z2')],
    });
    v2.close();

    const db = new RodilloDb(name);
    expect(db.verno).toBe(7);
    expect(await createStorage(db).listWorkouts()).toEqual([
      { id: 'c-2', name: 'Ya migrada', description: '', blocks: [makeBlock(300, 'Z2')] },
    ]);
    await db.routes.put({
      id: 'r',
      name: 'R',
      source: 'gpx',
      distanceM: 10,
      ascentM: 0,
      descentM: 0,
      maxGrade: 0,
      points: [],
    });
    expect(await db.routes.count()).toBe(1);
    db.close();
  });

  it('v3 → v4 adds recordings and the session in progress, keeping routes', async () => {
    const v3 = new Dexie(name);
    v3.version(3).stores({ workouts: 'id', history: 'id, dateMs', settings: 'key', routes: 'id' });
    await v3.table('routes').put({ id: 'gpx-1', name: 'Mía', source: 'gpx', points: [] });
    v3.close();

    const db = new RodilloDb(name);
    expect(db.verno).toBe(7);
    expect(await db.routes.count()).toBe(1);
    expect(await db.recordings.count()).toBe(0);
    expect(await db.inProgress.count()).toBe(0);
    db.close();
  });

  it('v4 → v5 adds training plans, keeping history and recordings', async () => {
    const v4 = new Dexie(name);
    v4.version(4).stores({
      workouts: 'id',
      history: 'id, dateMs',
      settings: 'key',
      routes: 'id',
      recordings: 'sessionId',
      inProgress: 'key',
    });
    await v4.table('history').put({ id: 'h-4', dateMs: 4, workoutName: 'Antes de los planes' });
    await v4.table('recordings').put({ sessionId: 'h-4', startMs: 4, samples: [] });
    v4.close();

    const db = new RodilloDb(name);
    const storage = createStorage(db);
    expect(db.verno).toBe(7);
    expect(await db.history.count()).toBe(1);
    expect(await db.recordings.count()).toBe(1);
    expect(await storage.listPlans()).toEqual([]);
    const plan = { id: 'p', name: 'S49', importedAtMs: 1, days: [] };
    await storage.savePlan(plan);
    expect(await storage.listPlans()).toEqual([plan]);
    db.close();
  });

  it('v5 → v6 renames the heart rate zones L1…VO2 to Z1…Z6 in stored data', async () => {
    const v5 = new Dexie(name);
    v5.version(5).stores({
      workouts: 'id',
      history: 'id, dateMs',
      settings: 'key',
      routes: 'id',
      recordings: 'sessionId',
      inProgress: 'key',
      plans: 'id',
    });
    const oldBlock = {
      type: 'block',
      durationSec: 600,
      target: { type: 'hr', zoneId: 'UA' },
      kind: 'work',
      note: '',
    };
    await v5.table('workouts').put({ id: 'c-5', name: 'Mía', description: '', blocks: [oldBlock] });
    await v5.table('history').put({
      id: 'h-5',
      dateMs: 5,
      workoutName: 'Mía',
      plannedSecByZone: { L1: 1, L2: 2, L3: 3, UA: 4, 'UA+': 5, VO2: 6 },
      counts: [{ atSec: 30, valuePer10s: 27, targetZoneId: 'UA', status: 'in' }],
    });
    await v5.table('settings').put({
      key: 'app',
      athlete: { hrZonesPer10s: [{ id: 'UA', label: 'Umbral mío', min: 26, max: 27 }] },
    });
    await v5.table('plans').put({
      id: 'p-5',
      name: 'S',
      importedAtMs: 5,
      days: [
        {
          date: '2026-12-01',
          title: 'X',
          notes: '',
          workout: { id: 'w', name: 'X', description: '', blocks: [oldBlock] },
        },
      ],
    });
    await v5.table('routes').put({ id: 'r-5', name: 'UA', source: 'gpx', points: [] });
    v5.close();

    const db = new RodilloDb(name);
    expect(db.verno).toBe(7);
    expect((await db.workouts.get('c-5'))?.blocks).toEqual([makeBlock(600, 'Z4', 'work')]);
    const h = await db.history.get('h-5');
    expect(h?.plannedSecByZone).toEqual({ Z1: 1, Z2: 2, Z3: 3, Z4: 4, Z5: 5, Z6: 6 });
    expect(h?.counts[0]?.targetZoneId).toBe('Z4');
    const settings = await db.settings.get('app');
    expect(settings?.athlete.hrZonesPer10s[0]).toEqual({
      id: 'Z4',
      label: 'Umbral mío',
      min: 26,
      max: 27,
    });
    expect((await db.plans.get('p-5'))?.days[0]?.workout?.blocks).toEqual([
      makeBlock(600, 'Z4', 'work'),
    ]);
    // Routes carry no zones: a route called «UA» keeps its name.
    expect((await db.routes.get('r-5'))?.name).toBe('UA');
    db.close();
  });

  it('v6 → v7 adds the landscapes table and keeps routes and history', async () => {
    const v6 = new Dexie(name);
    v6.version(6).stores({
      workouts: 'id',
      history: 'id, dateMs',
      settings: 'key',
      routes: 'id',
      recordings: 'sessionId',
      inProgress: 'key',
      plans: 'id',
    });
    await v6.table('routes').put({ id: 'gpx-6', name: 'Puerto', source: 'gpx', points: [] });
    await v6.table('history').put({ id: 'h-6', dateMs: 6, workoutName: 'X' });
    v6.close();

    const db = new RodilloDb(name);
    expect(db.verno).toBe(7);
    expect((await db.routes.get('gpx-6'))?.name).toBe('Puerto');
    expect((await db.history.get('h-6'))?.workoutName).toBe('X');
    // Nothing downloaded yet: the table starts empty.
    expect(await db.landscapes.count()).toBe(0);
    await createStorage(db).saveLandscape({
      routeId: 'gpx-6',
      downloadedAtMs: 7,
      tiles: 90,
      failed: 2,
      bytes: 3_000_000,
    });
    expect((await createStorage(db).listLandscapes())[0]).toMatchObject({
      routeId: 'gpx-6',
      failed: 2,
    });
    db.close();
  });
});
