import { useEffect, useState } from 'react';
import type { Route } from '../../domain/route/route';
import { type RealHeights, realHeights } from '../../domain/world/realTerrain';
import { loadRouteHeights } from '../../tiles/heights';

/**
 * The real heights of a route, if its landscape was downloaded; null meanwhile
 * and when there is none (the usual 3D view).
 */
export function useRealHeights(route: Route): RealHeights | null {
  const [state, setState] = useState<{ id: string; rh: RealHeights | null } | null>(null);
  useEffect(() => {
    let alive = true;
    void loadRouteHeights(route).then((h) => {
      if (alive) setState({ id: route.id, rh: h ? realHeights(route, h.near, h.far) : null });
    });
    return () => {
      alive = false;
    };
  }, [route]);
  return state?.id === route.id ? state.rh : null;
}
