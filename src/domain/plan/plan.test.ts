import { describe, expect, it } from 'vitest';
import { fitnessCurve } from '../metrics/fitness';
import type { SessionSummary } from '../metrics/summary';
import { makeBlock, makeRepeat } from '../workout/types';
import { validateWorkout } from '../workout/validate';
import type { HrZone } from '../zones/zones';
import { AGENT_INSTRUCTIONS } from './instructions';
import { PLAN_FORMAT, dayDone, extractJson, localDate, parsePlan } from './plan';
import { coachReport } from './report';

const day = (fecha: string, extra: object) => ({ fecha, ...extra });
const planText = (dias: object[]) => JSON.stringify({ formato: PLAN_FORMAT, nombre: 'S49', dias });

describe('plan import', () => {
  it('reads the example in the agent instructions exactly', () => {
    // The instructions are what the agent copies: their example must import as is.
    const r = parsePlan(AGENT_INSTRUCTIONS);
    expect(r.errors).toEqual([]);
    const [first, rest] = r.plan?.days ?? [];
    expect(first?.workout?.blocks).toEqual([
      makeBlock(600, 'L1', 'warm'),
      makeRepeat(4, [makeBlock(240, 'UA', 'work'), makeBlock(180, 'L1', 'rec')]),
      makeBlock(600, 'L1', 'cool', 'Soltar piernas'),
    ]);
    expect(first?.workout && validateWorkout(first.workout)).toEqual([]);
    expect(rest).toMatchObject({ date: '2026-12-01', workout: null, notes: 'Descanso total' });
  });

  it('finds the JSON inside prose and a code fence, and sorts the days', () => {
    const text = `Aquí tienes el plan:\n\`\`\`json\n${planText([
      day('2026-12-02', { titulo: 'B', bloques: [{ min: 30, zona: 'L2' }] }),
      day('2026-12-01', { titulo: 'A', bloques: [{ seg: 90, zona: 'VO2', tipo: 'serie' }] }),
    ])}\n\`\`\`\n¡Suerte!`;
    const r = parsePlan(text);
    expect(r.errors).toEqual([]);
    expect(r.plan?.days.map((d) => d.date)).toEqual(['2026-12-01', '2026-12-02']);
    expect(r.plan?.days[0]?.workout?.blocks[0]).toEqual(makeBlock(90, 'VO2', 'work'));
    expect(r.plan?.days[1]?.workout?.blocks[0]).toEqual(makeBlock(1800, 'L2', 'steady'));
  });

  it('reports every problem in Spanish and imports nothing', () => {
    const r = parsePlan(
      JSON.stringify({
        dias: [
          day('30/11/2026', {}),
          day('2026-12-01', { titulo: 'X', bloques: [{ min: 10, zona: 'Z9' }] }),
          day('2026-12-02', {
            titulo: 'Y',
            bloques: [{ repetir: 2, bloques: [{ repetir: 2, bloques: [] }] }, { zona: 'L1' }],
          }),
          day('2026-12-02', { descanso: true }),
        ],
      }),
    );
    expect(r.plan).toBeNull();
    expect(r.errors.join('\n')).toMatch(/formato/);
    expect(r.errors.join('\n')).toMatch(/Día 1: "fecha" debe ser AAAA-MM-DD/);
    expect(r.errors.join('\n')).toMatch(/zona «Z9» no existe/);
    expect(r.errors.join('\n')).toMatch(/no se pueden anidar/);
    expect(r.errors.join('\n')).toMatch(/duración no válida/);
    expect(r.errors.join('\n')).toMatch(/2026-12-02 está repetida/);
    expect(parsePlan('hola').errors).toEqual(['No hay ningún objeto JSON en el texto.']);
    expect(() => extractJson('{ roto: }')).toThrow(/no es válido/);
  });

  it('marks a day done when a session with its name was saved that day', () => {
    const r = parsePlan(
      planText([day('2026-12-01', { titulo: 'A', bloques: [{ min: 5, zona: 'L1' }] })]),
    );
    const d = r.plan?.days[0];
    if (!d) throw new Error('day');
    const at = new Date(2026, 11, 1, 19).getTime();
    expect(localDate(at)).toBe('2026-12-01');
    expect(dayDone(d, [{ dateMs: at, workoutName: 'A' }])).toBe(true);
    expect(dayDone(d, [{ dateMs: at, workoutName: 'B' }])).toBe(false);
    expect(dayDone(d, [{ dateMs: at + 86_400_000, workoutName: 'A' }])).toBe(false);
  });
});

describe('coach report', () => {
  const zones: HrZone[] = [
    { id: 'L1', label: 'L1', min: 20, max: 21 },
    { id: 'VO2', label: 'VO2', min: 29, max: null },
  ];
  const session = {
    id: 's',
    dateMs: new Date(2026, 10, 24, 18).getTime(),
    workoutName: 'Series',
    durationSec: 3600,
    load: 150,
    kcalEstimated: 0,
    plannedSecByZone: { L1: 0, L2: 0, L3: 0, UA: 0, 'UA+': 0, VO2: 0 },
    actualSecByZone: { L1: 1800, L2: 0, L3: 0, UA: 1800, 'UA+': 0, VO2: 0 },
    counts: [],
  } as SessionSummary;

  it('has the zones in ppm, the fitness and the recent sessions as JSON', () => {
    const now = new Date(2026, 10, 26, 10).getTime();
    const text = coachReport({
      sessions: [session],
      fitness: fitnessCurve([session], now, 90),
      zones,
      nowMs: now,
    });
    const data = extractJson(text) as {
      zonas_pulso: unknown;
      sesiones: { min_por_zona: Record<string, number> }[];
      forma: { estado: string };
    };
    expect(data.zonas_pulso).toEqual([
      { zona: 'L1', ppm: '120-126' },
      { zona: 'VO2', ppm: '174+' },
    ]);
    expect(data.sesiones).toHaveLength(1);
    expect(data.sesiones[0]?.min_por_zona).toMatchObject({ L1: 30, UA: 30 });
    expect(typeof data.forma.estado).toBe('string');
    expect(text).toMatch(/^# Informe de entrenamiento · 2026-11-26/);
  });
});
