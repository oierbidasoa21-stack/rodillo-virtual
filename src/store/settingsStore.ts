import { create } from 'zustand';
import type { AthleteConfig } from '../domain/zones/athleteConfig';
import { storage } from '../storage/repositories';
import { type AppSettings, defaultSettings } from '../storage/settings';

interface SettingsStore {
  settings: AppSettings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<AppSettings>) => Promise<void>;
  updateAthlete: (patch: Partial<AthleteConfig>) => Promise<void>;
}

/** In-memory copy of the settings; every change is written to IndexedDB. */
export const useSettingsStore = create<SettingsStore>()((set, get) => ({
  settings: defaultSettings(),
  loaded: false,
  load: async () => {
    set({ settings: await storage.getSettings(), loaded: true });
  },
  update: async (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    await storage.saveSettings(settings);
  },
  updateAthlete: async (patch) => {
    await get().update({ athlete: { ...get().settings.athlete, ...patch } });
  },
}));
