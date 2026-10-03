import type { ParseResult } from '../zones/athleteConfig';

/** A track point as read from a GPX file. */
export interface GpxPoint {
  lat: number;
  lon: number;
  /** Metres above sea level; null if the point has no <ele>. */
  ele: number | null;
}

export interface GpxTrack {
  name: string | null;
  points: GpxPoint[];
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(amp|lt|gt|quot|apos);/g, (_, e: string) => ENTITIES[e] ?? '');
}

function attr(tag: string, name: string): number | null {
  const m = new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`).exec(tag);
  const v = m ? Number(m[1]) : NaN;
  return Number.isFinite(v) ? v : null;
}

/**
 * Reads track points (or route points, if there's no track) from GPX text.
 * A small purpose-built reader: `domain/` must run in Node, which has no DOMParser.
 */
export function parseGpx(text: string): ParseResult<GpxTrack> {
  if (!/<gpx[\s>]/i.test(text)) return { ok: false, errors: ['El archivo no es un GPX.'] };

  const pointPattern = (tag: string) =>
    new RegExp(`<${tag}\\b([^>]*?)(?:/>|>([\\s\\S]*?)</${tag}>)`, 'gi');
  let matches = [...text.matchAll(pointPattern('trkpt'))];
  if (!matches.length) matches = [...text.matchAll(pointPattern('rtept'))];
  if (!matches.length) {
    return { ok: false, errors: ['El GPX no tiene puntos de recorrido (trkpt ni rtept).'] };
  }

  const points: GpxPoint[] = [];
  for (const m of matches) {
    const lat = attr(m[1] ?? '', 'lat');
    const lon = attr(m[1] ?? '', 'lon');
    if (lat === null || lon === null || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      continue;
    }
    const eleMatch = /<ele>\s*([^<]+?)\s*<\/ele>/i.exec(m[2] ?? '');
    const ele = eleMatch ? Number(eleMatch[1]) : NaN;
    points.push({ lat, lon, ele: Number.isFinite(ele) ? ele : null });
  }

  const errors: string[] = [];
  if (points.length < 2) errors.push('El GPX necesita al menos 2 puntos válidos.');
  if (points.length >= 2 && points.every((p) => p.ele === null)) {
    errors.push('El GPX no tiene altitud (<ele>): sin ella no hay pendiente.');
  }
  if (errors.length) return { ok: false, errors };

  const nameMatch =
    /<trk\b[\s\S]*?<name>([\s\S]*?)<\/name>/i.exec(text) ?? /<name>([\s\S]*?)<\/name>/i.exec(text);
  const name = nameMatch?.[1]?.trim() ? decodeEntities(nameMatch[1].trim()) : null;
  return { ok: true, value: { name, points } };
}
