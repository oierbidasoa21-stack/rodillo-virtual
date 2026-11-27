import { type FitnessDay, countsForFitness, freshnessLevel } from '../metrics/fitness';
import type { SessionSummary } from '../metrics/summary';
import { ZONE_IDS, type HrZone } from '../zones/zones';
import { PLAN_FORMAT, localDate } from './plan';

const LEVEL: Record<ReturnType<typeof freshnessLevel>, string> = {
  fresh: 'fresco',
  balanced: 'equilibrado',
  loaded: 'cargado',
  overloaded: 'muy cargado',
};

/**
 * A report for the user's coaching agent: the athlete's zones, current
 * condition/fatigue/freshness and the sessions of the last `days` days, as
 * Markdown with a JSON block the agent can read exactly. Personal data: it is
 * only ever copied or downloaded by the user.
 */
export function coachReport(args: {
  sessions: readonly SessionSummary[];
  fitness: readonly FitnessDay[];
  zones: readonly HrZone[];
  nowMs: number;
  days?: number;
}): string {
  const { sessions, fitness, zones, nowMs, days = 28 } = args;
  const since = nowMs - days * 86_400_000;
  const recent = sessions
    .filter((s) => s.dateMs >= since && countsForFitness(s))
    .sort((a, b) => a.dateMs - b.dateMs);
  const today = fitness.at(-1);
  const zoneText = zones.map((z) => ({
    zona: z.id,
    ppm: z.max === null ? `${z.min * 6}+` : `${z.min * 6}-${z.max * 6}`,
  }));
  const data = {
    fecha: localDate(nowMs),
    zonas_pulso: zoneText,
    forma: today
      ? {
          condicion_42d: Math.round(today.condition),
          fatiga_7d: Math.round(today.fatigue),
          frescura: Math.round(today.freshness),
          estado: LEVEL[freshnessLevel(today.freshness)],
        }
      : null,
    sesiones: recent.map((s) => ({
      fecha: localDate(s.dateMs),
      titulo: s.workoutName,
      min: Math.round(s.durationSec / 60),
      carga: Math.round(s.load),
      pulso_medio: s.hrMeasured?.avgBpm ? Math.round(s.hrMeasured.avgBpm) : null,
      pulso_max: s.hrMeasured?.maxBpm ? Math.round(s.hrMeasured.maxBpm) : null,
      min_por_zona: Object.fromEntries(
        ZONE_IDS.map((id) => [
          id,
          Math.round(((s.hrMeasured?.secByZone ?? s.actualSecByZone)[id] ?? 0) / 60),
        ]),
      ),
      ruta: s.ride ? { nombre: s.ride.routeName, km: +(s.ride.distanceM / 1000).toFixed(1) } : null,
    })),
  };
  const totalMin = recent.reduce((t, s) => t + s.durationSec / 60, 0);
  return [
    `# Informe de entrenamiento · ${localDate(nowMs)}`,
    '',
    'Entreno en rodillo por zonas de pulso y sensaciones (sin FTP medido). La carga de cada',
    'sesión es minutos en zona × peso de la zona (Z1 1, Z2 2, Z3 3, Z4 4, Z5 5, Z6 6); la',
    'condición es su media exponencial de 42 días, la fatiga la de 7 días y la frescura la',
    'diferencia.',
    '',
    `Últimos ${days} días: ${recent.length} sesiones, ${Math.round(totalMin / 60)} h ${Math.round(totalMin % 60)} min.`,
    today
      ? `Hoy: condición ${Math.round(today.condition)}, fatiga ${Math.round(today.fatigue)}, frescura ${Math.round(today.freshness)} (${LEVEL[freshnessLevel(today.freshness)]}).`
      : '',
    '',
    `Para el plan de la próxima semana usa el formato \`${PLAN_FORMAT}\` (ver instrucciones).`,
    '',
    '```json',
    JSON.stringify(data, null, 2),
    '```',
    '',
  ].join('\n');
}
