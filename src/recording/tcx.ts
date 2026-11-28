import type { RecordSample } from './recording';
import { maxOf } from '../domain/extent';

export interface TcxInput {
  name: string;
  startMs: number;
  samples: readonly RecordSample[];
  kcal: number | null;
  /** Power comes from a trainer curve, not a power meter: said in the notes. */
  powerEstimated: boolean;
  simulated: boolean;
  /** False for the made-up example routes: their coordinates are not real places. */
  includePosition?: boolean;
}

const escapeXml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c] ?? c,
  );

const iso = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
const int = (v: number) => String(Math.round(v));

function lastNumber(samples: readonly RecordSample[], key: 'distanceM'): number | null {
  for (let i = samples.length - 1; i >= 0; i--) {
    const v = samples[i]?.[key];
    if (v !== null && v !== undefined) return v;
  }
  return null;
}

function trackpoint(s: RecordSample, startMs: number, withPosition: boolean): string {
  const parts = [`<Time>${iso(startMs + s.t * 1000)}</Time>`];
  if (withPosition && s.lat !== null && s.lon !== null) {
    parts.push(
      `<Position><LatitudeDegrees>${s.lat.toFixed(7)}</LatitudeDegrees><LongitudeDegrees>${s.lon.toFixed(7)}</LongitudeDegrees></Position>`,
    );
  }
  if (s.altitudeM !== null)
    parts.push(`<AltitudeMeters>${s.altitudeM.toFixed(1)}</AltitudeMeters>`);
  if (s.distanceM !== null)
    parts.push(`<DistanceMeters>${s.distanceM.toFixed(1)}</DistanceMeters>`);
  if (s.hr !== null) parts.push(`<HeartRateBpm><Value>${int(s.hr)}</Value></HeartRateBpm>`);
  if (s.cadenceRpm !== null) parts.push(`<Cadence>${int(Math.min(254, s.cadenceRpm))}</Cadence>`);
  const ext: string[] = [];
  if (s.speedKmh !== null) ext.push(`<ns3:Speed>${(s.speedKmh / 3.6).toFixed(2)}</ns3:Speed>`);
  if (s.powerW !== null) ext.push(`<ns3:Watts>${int(s.powerW)}</ns3:Watts>`);
  if (ext.length) parts.push(`<Extensions><ns3:TPX>${ext.join('')}</ns3:TPX></Extensions>`);
  return `<Trackpoint>${parts.join('')}</Trackpoint>`;
}

/**
 * Garmin Training Center (TCX v2) file for Strava or Garmin Connect: one lap,
 * one trackpoint per recorded second. Element order follows the TCX schema.
 */
export function buildTcx(input: TcxInput): string {
  const { samples, startMs } = input;
  const hrs = samples.map((s) => s.hr).filter((v): v is number => v !== null);
  const lap = [
    `<TotalTimeSeconds>${samples.length}</TotalTimeSeconds>`,
    `<DistanceMeters>${(lastNumber(samples, 'distanceM') ?? 0).toFixed(1)}</DistanceMeters>`,
    `<Calories>${int(input.kcal ?? 0)}</Calories>`,
  ];
  if (hrs.length) {
    const avg = hrs.reduce((a, b) => a + b, 0) / hrs.length;
    lap.push(`<AverageHeartRateBpm><Value>${int(avg)}</Value></AverageHeartRateBpm>`);
    lap.push(`<MaximumHeartRateBpm><Value>${int(maxOf(hrs) ?? 0)}</Value></MaximumHeartRateBpm>`);
  }
  lap.push('<Intensity>Active</Intensity>', '<TriggerMethod>Manual</TriggerMethod>');

  const notes = [`${input.name} · Rodillo Virtual`];
  if (input.powerEstimated) notes.push('Potencia estimada con la curva del rodillo.');
  if (input.simulated) notes.push('Datos de sensores simulados.');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2">',
    '<Activities><Activity Sport="Biking">',
    `<Id>${iso(startMs)}</Id>`,
    `<Lap StartTime="${iso(startMs)}">${lap.join('')}<Track>`,
    ...samples.map((s) => trackpoint(s, startMs, input.includePosition ?? true)),
    '</Track></Lap>',
    `<Notes>${escapeXml(notes.join(' '))}</Notes>`,
    '</Activity></Activities>',
    '</TrainingCenterDatabase>',
    '',
  ].join('\n');
}

/** `rodillo-2026-11-25-1830-umbral-3x10.tcx`, with the local date and time. */
export function tcxFileName(startMs: number, name: string): string {
  const d = new Date(startMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  const slug =
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'salida';
  return `rodillo-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}-${slug}.tcx`;
}
