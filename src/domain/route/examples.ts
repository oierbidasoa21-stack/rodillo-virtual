import type { GpxPoint } from './gpx';
import { type Route, buildRoute } from './route';

/**
 * Three invented routes that ship with the app. Not real places: coordinates
 * sit around (0°, 0°) in the sea, only the shape and the profile matter.
 */

const STEP_M = 10;
const M_PER_DEG = (2 * Math.PI * 6_371_000) / 360;
const TAU = 2 * Math.PI;

interface Design {
  id: string;
  name: string;
  description: string;
  lengthM: number;
  /** Elevation in metres at distance d. */
  ele: (d: number) => number;
  /** Heading in radians at distance d (0 = east), integrated into the path. */
  heading: (d: number) => number;
}

function generate(design: Design): Route {
  const pts: GpxPoint[] = [];
  let x = 0;
  let y = 0;
  for (let d = 0; d <= design.lengthM; d += STEP_M) {
    pts.push({ lat: y / M_PER_DEG, lon: x / M_PER_DEG, ele: design.ele(d) });
    const h = design.heading(d);
    x += Math.cos(h) * STEP_M;
    y += Math.sin(h) * STEP_M;
  }
  const route = buildRoute(pts, { id: design.id, name: design.name, source: 'builtin' });
  if (!route) throw new Error(`Example route ${design.id} has no length`);
  return { ...route, description: design.description };
}

/** Climb of the Puerto: 8 km averaging 6 %, between 4.5 and 7.5 %. */
const CLIMB = { startM: 3000, lengthM: 8000, avgGrade: 0.06, swing: 0.015, waveM: 2000 } as const;
const climbGain = (x: number) =>
  CLIMB.avgGrade * x +
  ((CLIMB.swing * CLIMB.waveM) / TAU) * (1 - Math.cos((TAU * x) / CLIMB.waveM));

function puertoEle(d: number): number {
  const top = CLIMB.startM + CLIMB.lengthM; // 11 km
  const base = 400;
  if (d < CLIMB.startM) return base + 2 * Math.sin((TAU * d) / 1500);
  if (d <= top) return base + climbGain(d - CLIMB.startM);
  const summit = base + climbGain(CLIMB.lengthM);
  if (d <= top + 1000) return summit; // 1 km along the top
  return summit - climbGain(Math.min(CLIMB.lengthM, d - top - 1000)); // same road down
}

const DESIGNS: readonly Design[] = [
  {
    id: 'ej-embalse',
    name: 'Vuelta al Embalse',
    description: 'Llano de 20 km alrededor de un embalse inventado. Para rodar a ritmo.',
    lengthM: 20_000,
    ele: (d) => 320 + 3 * Math.sin((TAU * d) / 4000) + 1 * Math.sin((TAU * d) / 1700),
    heading: (d) => (TAU * d) / 20_000 + 0.3 * Math.sin((TAU * 3 * d) / 20_000),
  },
  {
    id: 'ej-puerto',
    name: 'Puerto de la Sierra Imaginaria',
    description: '3 km de aproximación, 8 km de subida al 6 % de media y la bajada.',
    lengthM: 20_000,
    ele: puertoEle,
    heading: (d) =>
      d < CLIMB.startM ? 0 : 1.2 + 1.3 * Math.sin((TAU * (d - CLIMB.startM)) / 1500),
  },
  {
    id: 'ej-rompepiernas',
    name: 'Rompepiernas del Valle',
    description: '15 km sin un metro llano: repechos cortos del 3 al 8 %.',
    lengthM: 15_000,
    ele: (d) => 200 + 15 * Math.sin((TAU * d) / 1600) + 2 * Math.sin((TAU * d) / 500),
    heading: (d) => (TAU * d) / 15_000 + 0.5 * Math.sin((TAU * 5 * d) / 15_000),
  },
];

let cache: Route[] | null = null;

/** Built-in routes, generated once on first use. */
export function builtinRoutes(): Route[] {
  cache ??= DESIGNS.map(generate);
  return cache;
}
