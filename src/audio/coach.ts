import type { Climb } from '../domain/route/climbs';
import type { BlockKind } from '../domain/workout/types';
import type { ZoneStatus } from '../domain/zones/zones';

/**
 * Spoken coaching beyond the block announcements: heart rate out of its zone,
 * halfway and last minute of long blocks, climbs coming up on a route and a
 * summary at the end. Pure: it only decides what to say.
 */
export interface CoachState {
  stepIndex: number;
  halfSaid: boolean;
  lastMinuteSaid: boolean;
  /** Heart rate out of the zone since this session second, and which way. */
  outSinceSec: number | null;
  outStatus: ZoneStatus | null;
  /** Session second of the last heart rate cue (to keep them apart). */
  lastHrCueSec: number;
  /** A heart rate cue was given in this block and not yet answered with "en zona". */
  pendingBackInZone: boolean;
  inSinceSec: number | null;
}

export function startCoach(): CoachState {
  return {
    stepIndex: -1,
    halfSaid: false,
    lastMinuteSaid: false,
    outSinceSec: null,
    outStatus: null,
    lastHrCueSec: -Infinity,
    pendingBackInZone: false,
    inSinceSec: null,
  };
}

export interface CoachInput {
  /** Seconds since the session started (running time). */
  nowSec: number;
  stepIndex: number;
  stepKind: BlockKind;
  elapsedInStepSec: number;
  stepDurationSec: number;
  /** Heart rate against the block's zone; null without a strap or a zone. */
  hrStatus: ZoneStatus | null;
}

/** Heart rate has to settle after a change of block before it is judged. */
export const HR_SETTLE_SEC = 60;
/** Out of the zone this long before saying anything. */
export const HR_OUT_SEC = 25;
/** At least this long between heart rate cues. */
export const HR_CUE_GAP_SEC = 90;
/** Back in the zone this long before saying so. */
const HR_BACK_SEC = 10;
const HALF_MIN_SEC = 240;
const LAST_MINUTE_MIN_SEC = 300;

export function coachTick(
  state: CoachState,
  input: CoachInput,
): { state: CoachState; say: string[] } {
  const say: string[] = [];
  let s = state;
  if (input.stepIndex !== s.stepIndex) {
    s = {
      ...s,
      stepIndex: input.stepIndex,
      halfSaid: false,
      lastMinuteSaid: false,
      outSinceSec: null,
      outStatus: null,
      pendingBackInZone: false,
      inSinceSec: null,
    };
  }
  const { elapsedInStepSec: el, stepDurationSec: dur } = input;

  if (!s.halfSaid && dur >= HALF_MIN_SEC && el >= dur / 2 && dur - el > 60) {
    say.push('Mitad del bloque');
    s = { ...s, halfSaid: true };
  }
  if (!s.lastMinuteSaid && dur >= LAST_MINUTE_MIN_SEC && dur - el <= 60 && dur - el > 15) {
    say.push('Último minuto');
    s = { ...s, lastMinuteSaid: true };
  }

  const easyBlock = input.stepKind === 'rec' || input.stepKind === 'cool';
  // Below the zone is fine while recovering; only "above" counts there.
  const status = input.hrStatus === 'below' && easyBlock ? 'in' : input.hrStatus;
  if (status === null || el < HR_SETTLE_SEC) {
    return { state: { ...s, outSinceSec: null, outStatus: null, inSinceSec: null }, say };
  }
  if (status === 'in') {
    const inSince = s.inSinceSec ?? input.nowSec;
    s = { ...s, outSinceSec: null, outStatus: null, inSinceSec: inSince };
    if (s.pendingBackInZone && input.nowSec - inSince >= HR_BACK_SEC) {
      say.push('Pulso en zona, así');
      s = { ...s, pendingBackInZone: false };
    }
    return { state: s, say };
  }
  const outSince = s.outStatus === status && s.outSinceSec !== null ? s.outSinceSec : input.nowSec;
  s = { ...s, outSinceSec: outSince, outStatus: status, inSinceSec: null };
  if (input.nowSec - outSince >= HR_OUT_SEC && input.nowSec - s.lastHrCueSec >= HR_CUE_GAP_SEC) {
    say.push(
      status === 'above'
        ? easyBlock
          ? 'Pulso alto: suelta y deja que baje'
          : 'Pulso por encima de la zona, afloja un poco'
        : 'Pulso por debajo de la zona, aprieta un poco',
    );
    s = { ...s, lastHrCueSec: input.nowSec, pendingBackInZone: true };
  }
  return { state: s, say };
}

/** "1,2 kilómetros" or "800 metros". */
function spokenLength(m: number): string {
  if (m < 1000) return `${Math.round(m / 50) * 50} metros`;
  return `${(m / 1000).toFixed(1).replace('.', ',')} kilómetros`;
}

/**
 * Cues for climbs whose marks the rider crossed between `fromM` and `toM`
 * (distances along the route, `fromM` ≤ `toM`): 300 m before, 500 m to the top
 * on long climbs, and the top.
 */
export function climbCues(climbs: readonly Climb[], fromM: number, toM: number): string[] {
  const out: string[] = [];
  const crossed = (mark: number) => fromM < mark && mark <= toM;
  for (const c of climbs) {
    const length = c.endM - c.startM;
    const pct = Math.round(c.avgGrade * 100);
    if (crossed(c.startM - 300)) {
      out.push(`Subida en 300 metros: ${spokenLength(length)} al ${pct} por ciento`);
    }
    if (length >= 1200 && crossed(c.endM - 500)) out.push('Quinientos metros para la cima');
    if (crossed(c.endM)) out.push('Cima');
  }
  return out;
}

/** Said at the end: "Sesión terminada: 45 minutos, carga 120, pulso medio 142." */
export function finishSummary(args: {
  durationSec: number;
  load: number | null;
  avgBpm: number | null;
  distanceM: number | null;
}): string {
  const parts = [`${Math.round(args.durationSec / 60)} minutos`];
  if (args.distanceM !== null && args.distanceM > 0) parts.push(spokenLength(args.distanceM));
  if (args.load !== null && args.load > 0) parts.push(`carga ${Math.round(args.load)}`);
  if (args.avgBpm !== null && args.avgBpm > 0) parts.push(`pulso medio ${Math.round(args.avgBpm)}`);
  return `Sesión terminada: ${parts.join(', ')}. Buen trabajo.`;
}
