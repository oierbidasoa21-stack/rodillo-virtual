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
  blocks: [makeBlock(600, 'Z1', 'warm'), makeRepeat(3, [makeBlock(600, 'Z4', 'work')])],
  maxHr: { type: 'bpm' as const, bpm: 165 },
};

const session: SessionSummary = {
  id: 'h-1',
  dateMs: 1_700_000_000_000,
  workoutName: 'Mía',
  durationSec: 3600,
  load: 150,
  kcalEstimated: 700,
  plannedSecByZone: { ...emptySecByZone(), Z1: 600, Z4: 1800 },
  actualSecByZone: { ...emptySecByZone(), Z1: 600, Z4: 1750 },
  counts: [{ atSec: 900, valuePer10s: 27, targetZoneId: 'Z4', status: 'in' }],
  hrMeasured: {
    secByZone: { ...emptySecByZone(), Z4: 1500 },
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
  ride: {
    routeId: 'ej-puerto',
    routeName: 'Puerto',
    distanceM: 20_000,
    ascentM: 480,
    avgSpeedKmh: 20,
    mode: 'power',
    laps: 0,
  },
  hrCap: { cappedSec: 3500, aboveSec: 42 },
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

const recording = {
  sessionId: 'h-1',
  startMs: 1_700_000_000_000,
  samples: [
    {
      t: 1,
      hr: 120,
      powerW: 180,
      speedKmh: 30,
      cadenceRpm: 88,
      distanceM: 8.3,
      altitudeM: null,
      lat: null,
      lon: null,
    },
    {
      t: 2,
      hr: null,
      powerW: null,
      speedKmh: null,
      cadenceRpm: null,
      distanceM: null,
      altitudeM: null,
      lat: null,
      lon: null,
    },
  ],
};

async function filled(): Promise<Storage> {
  const s = freshStorage();
  await s.saveRoute(route);
  await s.saveRecording(recording);
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
    expect(backup.recordings).toEqual([recording]);
  });

  it('round-trips through JSON into another browser', async () => {
    const backup = await exportBackup(await filled(), 1234);
    const parsed = parseBackup(JSON.parse(JSON.stringify(backup)));
    if (!parsed.ok) throw new Error(parsed.errors.join(' '));
    expect(parsed.value.skipped).toEqual({
      workouts: 0,
      history: 0,
      routes: 0,
      recordings: 0,
      plans: 0,
    });

    const target = freshStorage();
    await importBackup(target, parsed.value.backup);
    expect(await target.listWorkouts()).toEqual([workout]);
    expect(await target.listHistory()).toEqual([session]);
    expect((await target.getSettings()).athlete.weightKg).toBe(66);
    expect(await target.listRoutes()).toEqual([route]);
    expect(await target.getRecording('h-1')).toEqual(recording);
  });

  it('still reads format 1 backups (before routes existed)', () => {
    const parsed = parseBackup({ app: BACKUP_APP, format: 1, workouts: [], history: [] });
    expect(parsed.ok && parsed.value.backup.routes).toEqual([]);
  });

  it('reads a copy made before phase 9 (zones L1…VO2) as Z1…Z6', () => {
    const zones = { L1: 60, L2: 0, L3: 0, UA: 120, 'UA+': 0, VO2: 0 };
    const parsed = parseBackup({
      app: BACKUP_APP,
      format: 3,
      workouts: [
        {
          id: 'w-old',
          name: 'Vieja',
          description: '',
          blocks: [
            {
              type: 'block',
              durationSec: 600,
              target: { type: 'hr', zoneId: 'UA' },
              kind: 'work',
              note: '',
            },
          ],
        },
      ],
      history: [{ ...session, id: 'h-old', plannedSecByZone: zones, actualSecByZone: zones }],
      settings: {
        athlete: {
          weightKg: 70,
          bikeWeightKg: 9,
          hrZonesPer10s: [
            { id: 'L1', label: 'L1', min: 20, max: 21 },
            { id: 'L2', label: 'L2', min: 22, max: 23 },
            { id: 'L3', label: 'L3', min: 24, max: 25 },
            { id: 'UA', label: 'UA (umbral)', min: 26, max: 27 },
            { id: 'UA+', label: 'UA+', min: 28, max: 28 },
            { id: 'VO2', label: 'VO2', min: 29, max: null },
          ],
        },
      },
    });
    if (!parsed.ok) throw new Error(parsed.errors.join(' '));
    const { backup, skipped } = parsed.value;
    expect(skipped).toMatchObject({ workouts: 0, history: 0 });
    expect(backup.workouts[0]?.blocks).toEqual([makeBlock(600, 'Z4', 'work')]);
    expect(backup.history[0]?.plannedSecByZone).toEqual({
      Z1: 60,
      Z2: 0,
      Z3: 0,
      Z4: 120,
      Z5: 0,
      Z6: 0,
    });
    // Not the example zones: the copy's own, renamed.
    expect(backup.settings.athlete.hrZonesPer10s.map((z) => z.id)).toEqual([
      'Z1',
      'Z2',
      'Z3',
      'Z4',
      'Z5',
      'Z6',
    ]);
    expect(backup.settings.athlete.weightKg).toBe(70);
  });

  it('keeps training plans and skips a broken one', () => {
    const plan = {
      id: 'p1',
      name: 'S49',
      importedAtMs: 5,
      days: [
        {
          date: '2026-11-30',
          title: 'Rodaje',
          notes: '',
          workout: {
            id: 'plan-2026-11-30',
            name: 'Rodaje',
            description: '',
            blocks: [makeBlock(1800, 'Z2')],
          },
        },
        { date: '2026-12-01', title: 'Descanso', notes: '', workout: null },
      ],
    };
    const broken = { ...plan, id: 'p2', days: [{ date: 'mañana' }] };
    const parsed = parseBackup({
      app: BACKUP_APP,
      format: BACKUP_FORMAT,
      workouts: [],
      history: [],
      plans: [plan, broken],
    });
    expect(parsed.ok && parsed.value.backup.plans).toEqual([plan]);
    expect(parsed.ok && parsed.value.skipped.plans).toBe(1);
  });

  it('skips a recording with a broken sample', () => {
    const broken = { ...recording, sessionId: 'x', samples: [{ t: 1, hr: 'mucho' }] };
    const parsed = parseBackup({
      app: BACKUP_APP,
      format: BACKUP_FORMAT,
      workouts: [],
      history: [],
      recordings: [recording, broken],
    });
    expect(parsed.ok && parsed.value.skipped.recordings).toBe(1);
    expect(parsed.ok && parsed.value.backup.recordings).toEqual([recording]);
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
          blocks: [{ type: 'block', durationSec: 300, zoneId: 'Z2', kind: 'steady', note: '' }],
        },
      ],
      history: [],
      settings: {},
    });
    expect(parsed.ok && parsed.value.backup.workouts[0]?.blocks).toEqual([makeBlock(300, 'Z2')]);
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
    expect(parsed.value.skipped).toEqual({
      workouts: 1,
      history: 1,
      routes: 0,
      recordings: 0,
      plans: 0,
    });
    expect(parsed.value.backup.settings).toEqual(defaultSettings());
  });

  it('keeps older history entries without measured heart rate', () => {
    const { hrMeasured: _hr, power: _power, ride: _ride, hrCap: _cap, ...older } = session;
    void _hr;
    void _power;
    void _ride;
    void _cap;
    const parsed = parseBackup({ app: BACKUP_APP, format: 1, workouts: [], history: [older] });
    expect(parsed.ok && parsed.value.backup.history[0]).toEqual(older);
  });

  it('drops a time above the heart rate ceiling that does not add up', () => {
    const broken = { ...session, hrCap: { cappedSec: 100, aboveSec: 500 } };
    const parsed = parseBackup({
      app: BACKUP_APP,
      format: BACKUP_FORMAT,
      workouts: [],
      history: [broken],
    });
    if (!parsed.ok) throw new Error(parsed.errors.join(' '));
    expect(parsed.value.backup.history[0]?.hrCap).toBeUndefined();
    expect(parsed.value.backup.history[0]?.id).toBe('h-1');
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
