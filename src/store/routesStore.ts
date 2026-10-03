import { create } from 'zustand';
import type { Route } from '../domain/route/route';
import { storage } from '../storage/repositories';

interface RoutesStore {
  /** Routes imported from GPX (built-in ones come from domain/route/examples). */
  imported: Route[];
  loaded: boolean;
  load: () => Promise<void>;
  save: (route: Route) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useRoutesStore = create<RoutesStore>()((set, get) => ({
  imported: [],
  loaded: false,
  load: async () => {
    set({ imported: await storage.listRoutes(), loaded: true });
  },
  save: async (route) => {
    set({ imported: [...get().imported.filter((r) => r.id !== route.id), route] });
    await storage.saveRoute(route);
  },
  remove: async (id) => {
    set({ imported: get().imported.filter((r) => r.id !== id) });
    await storage.deleteRoute(id);
  },
}));
