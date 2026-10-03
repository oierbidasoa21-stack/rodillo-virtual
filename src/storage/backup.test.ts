import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SessionSummary } from '../domain/metrics/summary';
import { emptySecByZone } from '../domain/metrics/timeInZone';
import { buildRoute } from '../domain/route/route';
import { makeBlock, makeRepeat } from '../domain/workout/types';
import {
  BACKUP_APP,
  BACKUP_FORMAT,
  backupFileName,
  exportBackup,
  importBackup,
  parseBackup,
} from './backup';
import { RodilloDb } from './db';
import { type Storage, createStorage } from './repositories';
import { defaultSettings } from './settings';

let dbs: RodilloDb[] = [];
function freshStorage(): Storage {
  const db = new RodilloDb(`backup-${crypto.randomUUID()}`);
  dbs.push(db);
  return createStorage(db);
}

beforeEach(() => {
  dbs = [];
});
afterEach(async () => {
  await Promise.all(dbs.map((db) => db.delete()));
});

const workout = {
  id: 'c-1',
  name: 'Mía',
  description: 'Con repetición',
  blocks: [makeBlock(600, 'L1', 'warm'), makeRepeat(3, [makeBlock(600, 'UA', 'work')])],
};

const session: SessionSummary = {
  id: 'h-1',
  dateMs: 1_700_000_000_000,
  workoutName: 'Mía',
  durationSec: 3600,
  load: 150,
  kcalEstimated: 700,
  plannedSecByZone: { ...emptySecByZone(), L1: 600, UA: 1800 },
  actualSecByZone: { ...emptySecByZone(), L1: 600, UA: 1750 },
  counts: [{ atSec: 900, valuePer10s: 27, targetZoneId: 'UA', status: 'in' }],
  hrMeasured: {
    secByZone: { ...emptySecByZone(), UA: 1500 },
    belowSec: 30,
    coveredSec: 3500,
    avgBpm: 151,
    maxBpm: 170,
    simulated: true,
  },
  power: {
    avgW: 180,
    maxW: 320,
    npW: 195,
    ifactor: 0.8,
    tss: 64,
    kJ: 640,
    coveredSec: 3550,
    secByPowerZone: { Z1: 600, Z2: 900, Z3: 1200, Z4: 700, Z5: 150, Z6: 0, Z7: 0 },
    estimated: true,
    simulated: true,
  },
};

const builtRoute = buildRoute(
  [
    { lat: 0, lon: 0, ele: 100 },
    { lat: 0.001, lon: 0, ele: 105 },
  ],
  { id: 'gpx-1', name: 'Mi subida', source: 'gpx' },
);
if (!builtRoute) throw new Error('route');
const route = builtRoute;

async function filled(): Promise<Storage> {
  const s = freshStorage();
  await s.saveRoute(route);
  await s.saveWorkout(workout);
  await s.addHistory(session);
  const settings = defaultSettings();
  await s.saveSettings({
    ...settings,
    beeps: false,
    athlete: { ...settings.athlete, weightKg: 66 },
  });
  return s;
}

describe('backup', () => {
  it('exports workouts, history and settings', async () => {
    const backup = await exportBackup(await filled(), 1234);
    expect(backup).toMatchObject({ app: BACKUP_APP, format: BACKUP_FORMAT, exportedAtMs: 1234 });
    expect(backup.workouts).toEqual([workout]);
    expect(backup.history).toEqual([session]);
    expect(backup.settings.beeps).toBe(false);
    expect(backup.settings.athlete.weightKg).toBe(66);
    expect(backup.routes).toEqual([route]);
  });

  it('round-trips through JSON into another browser', async () => {
    const backup = await exportBackup(await filled(), 1234);
    const parsed = parseBackup(JSON.parse(JSON.stringify(backup)));
    if (!parsed.ok) throw new Error(parsed.errors.join(' '));
    expect(parsed.value.skipped).toEqual({ workouts: 0, history: 0, routes: 0 });

    const target = freshStorage();
    await importBackup(target, parsed.value.backup);
    expect(await target.listWorkouts()).toEqual([workout]);
    expect(await target.listHistory()).toEqual([session]);
    expect((await target.getSettings()).athlete.weightKg).toBe(66);
    expect(await target.listRoutes()).toEqual([route]);
  });

  it('still reads format 1 backups (before routes existed)', () => {
    const parsed = parseBackup({ app: BACKUP_APP, format: 1, workouts: [], history: [] });
    expect(parsed.ok && parsed.value.backup.routes).toEqual([]);
  });

  it('skips a route with a broken point', () => {
    const broken = { ...route, points: [...route.points, { distanceM: 'x' }] };
    const parsed = parseBackup({
      app: BACKUP_APP,
      format: BACKUP_FORMAT,
      workouts: [],
      history: [],
      routes: [route, broken],
    });
    expect(parsed.ok && parsed.value.skipped.routes).toBe(1);
  });

  it('replaces what was there before', async () => {
    const target = freshStorage();
    await target.saveWorkout({ ...workout, id: 'old', name: 'Vieja' });
    await target.addHistory({ ...session, id: 'old-h' });
    const backup = await exportBackup(await filled(), 1);
    await importBackup(target, backup);
    expect((await target.listWorkouts()).map((w) => w.id)).toEqual(['c-1']);
    expect((await target.listHistory()).map((h) => h.id)).toEqual(['h-1']);
  });

  it('migrates pre-phase-4 workouts inside a backup', () => {
    const parsed = parseBackup({
      app: BACKUP_APP,
      format: BACKUP_FORMAT,
      workouts: [
        {
          id: 'v1',
          name: 'Antigua',
          description: '',
          blocks: [{ type: 'block', durationSec: 300, zoneId: 'L2', kind: 'steady', note: '' }],
        },
      ],
      history: [],
      settings: {},
    });
    expect(parsed.ok && parsed.value.backup.workouts[0]?.blocks).toEqual([makeBlock(300, 'L2')]);
  });

  it('skips unreadable entries and counts them instead of guessing', () => {
    const parsed = parseBackup({
      app: BACKUP_APP,
      format: BACKUP_FORMAT,
      workouts: [workout, { id: 7 }],
      history: [session, { id: 'broken', dateMs: 'ayer' }],
      settings: 'nope',
    });
    if (!parsed.ok) throw new Error('should parse');
    expect(parsed.value.skipped).toEqual({ workouts: 1, history: 1, routes: 0 });
    expect(parsed.value.backup.settings).toEqual(defaultSettings());
  });

  it('keeps older history entries without measured heart rate', () => {
    const { hrMeasured: _hr, power: _power, ...older } = session;
    void _hr;
    void _power;
    const parsed = parseBackup({ app: BACKUP_APP, format: 1, workouts: [], history: [older] });
    expect(parsed.ok && parsed.value.backup.history[0]).toEqual(older);
  });

  it('rejects files that are not backups of this app', () => {
    expect(parseBackup(null)).toEqual({
      ok: false,
      errors: ['El archivo no es una copia de Rodillo Virtual.'],
    });
    expect(parseBackup({ weightKg: 70 }).ok).toBe(false);
    expect(parseBackup({ app: BACKUP_APP, format: 99, workouts: [], history: [] }).ok).toBe(false);
    expect(parseBackup({ app: BACKUP_APP, format: 1, workouts: [] }).ok).toBe(false);
  });

  it('names the file after the local date, even just after midnight', () => {
    expect(backupFileName(new Date(2026, 9, 3, 0, 30).getTime())).toBe(
      'rodillo-virtual-copia-2026-10-03.json',
    );
  });
});
