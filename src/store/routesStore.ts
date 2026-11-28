import { create } from 'zustand';
import type { Route } from '../domain/route/route';
import type { RouteLandscape } from '../storage/db';
import { storage } from '../storage/repositories';
import { deleteLandscapeTiles } from '../tiles/landscape';

interface RoutesStore {
  /** Routes imported from GPX (built-in ones come from domain/route/examples). */
  imported: Route[];
  /** Real landscapes downloaded, by route id (phase 10). */
  landscapes: Record<string, RouteLandscape>;
  loaded: boolean;
  load: () => Promise<void>;
  save: (route: Route) => Promise<void>;
  /** Deletes the route and, if it had one, its landscape. */
  remove: (id: string) => Promise<void>;
  saveLandscape: (row: RouteLandscape) => Promise<void>;
  /** Deletes a route's landscape: its row and the tiles no other landscape uses. */
  removeLandscape: (routeId: string) => Promise<void>;
}

const byRoute = (rows: RouteLandscape[]) => Object.fromEntries(rows.map((r) => [r.routeId, r]));

export const useRoutesStore = create<RoutesStore>()((set, get) => ({
  imported: [],
  landscapes: {},
  loaded: false,
  load: async () => {
    const [imported, landscapes] = await Promise.all([
      storage.listRoutes(),
      storage.listLandscapes(),
    ]);
    set({ imported, landscapes: byRoute(landscapes), loaded: true });
  },
  save: async (route) => {
    set({ imported: [...get().imported.filter((r) => r.id !== route.id), route] });
    await storage.saveRoute(route);
  },
  remove: async (id) => {
    if (get().landscapes[id]) await get().removeLandscape(id);
    set({ imported: get().imported.filter((r) => r.id !== id) });
    await storage.deleteRoute(id);
  },
  saveLandscape: async (row) => {
    set({ landscapes: { ...get().landscapes, [row.routeId]: row } });
    await storage.saveLandscape(row);
  },
  removeLandscape: async (routeId) => {
    const { imported, landscapes } = get();
    const route = imported.find((r) => r.id === routeId);
    const rest = Object.fromEntries(Object.entries(landscapes).filter(([id]) => id !== routeId));
    set({ landscapes: rest });
    await storage.deleteLandscape(routeId);
    if (route) {
      const others = imported.filter((r) => r.id !== routeId && rest[r.id]);
      await deleteLandscapeTiles(route, others);
    }
  },
}));
