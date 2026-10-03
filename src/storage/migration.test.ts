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
    const expected = [makeBlock(600, 'L1', 'warm'), makeRepeat(3, [makeBlock(600, 'UA', 'work')])];
    expect((await storage.listWorkouts())[0]?.blocks).toEqual(expected);
    // Rewritten on disk, not just on read
    expect((await db.workouts.get('c-1'))?.blocks).toEqual(expected);
    // Other tables untouched
    expect(await db.history.count()).toBe(1);
    expect(db.verno).toBe(3);
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
      blocks: [makeBlock(300, 'L2')],
    });
    v2.close();

    const db = new RodilloDb(name);
    expect(db.verno).toBe(3);
    expect(await createStorage(db).listWorkouts()).toEqual([
      { id: 'c-2', name: 'Ya migrada', description: '', blocks: [makeBlock(300, 'L2')] },
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
});
