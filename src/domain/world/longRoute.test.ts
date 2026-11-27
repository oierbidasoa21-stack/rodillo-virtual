import { describe, expect, it } from 'vitest';
import { buildRoute } from '../route/route';
import { projectRoute } from './path';
import { centreDashes, edgeLines, ribbon, roadsidePosts } from './road';
import { guardrails, placeSpectators } from './roadside';
import { horizonRing, scatterBushes, scatterRocks, scatterTrees } from './scenery';
import { TERRAIN_MARGIN_M, indexRoad, pathBounds, terrainGrid } from './terrain';

const M_PER_DEG = 111_195;

/** A 160 km ride: winding north with gentle bends and hills, a point every 100 m. */
function longRoute() {
  const pts = Array.from({ length: 1601 }, (_, i) => {
    const north = i * 100;
    const east = 800 * Math.sin(i / 25);
    return {
      lat: 43 + north / M_PER_DEG,
      lon: -2 + east / (M_PER_DEG * Math.cos((43 * Math.PI) / 180)),
      ele: 300 + 150 * Math.sin(i / 60),
    };
  });
  const route = buildRoute(pts, { id: 'long', name: 'Larga', source: 'gpx' });
  if (!route) throw new Error('route');
  return route;
}

describe('a long route (160 km)', () => {
  it('builds the whole 3D world without overflowing the stack', () => {
    // On a 1 m path this is ~160 000 points: spreading them into Math.min/max
    // used to throw «Maximum call stack size exceeded».
    const route = longRoute();
    expect(route.distanceM).toBeGreaterThan(160_000);
    const path = projectRoute(route);
    expect(path.points.length).toBeGreaterThan(160_000);

    const index = indexRoad(path);
    const b = pathBounds(path, 0);
    expect(b.maxZ - b.minZ).toBeGreaterThan(159_000);
    expect(terrainGrid(path, index).positions.length).toBeGreaterThan(0);
    expect(horizonRing(path, TERRAIN_MARGIN_M).positions.length).toBeGreaterThan(0);
    expect(ribbon(path, 3).positions.length).toBe(path.points.length * 6);
    expect(edgeLines(path).indices.length).toBeGreaterThan(0);
    expect(centreDashes(path).indices.length).toBeGreaterThan(0);
    expect(roadsidePosts(path).length).toBeGreaterThan(0);
    expect(scatterTrees(path, index).length).toBeGreaterThan(0);
    expect(scatterBushes(path, index).length).toBeGreaterThan(0);
    expect(scatterRocks(path, index).length).toBeGreaterThan(0);
    expect(placeSpectators(path, index).length).toBeGreaterThan(0);
    expect(guardrails(path).posts.length).toBeGreaterThanOrEqual(0);
  }, 60_000);
});
