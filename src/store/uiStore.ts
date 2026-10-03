import { create } from 'zustand';
import type { RideMode } from '../domain/route/ride';
import type { Route } from '../domain/route/route';
import type { Workout } from '../domain/workout/types';
import type { StoragePersistence } from '../storage/persist';

export type Tab = 'library' | 'routes' | 'history' | 'sensors' | 'settings';

interface UiStore {
  tab: Tab;
  setTab: (tab: Tab) => void;
  /** Workout open in the editor. `id: null` means a new, unsaved workout. */
  editing: (Omit<Workout, 'id'> & { id: string | null }) | null;
  openEditor: (draft: Omit<Workout, 'id'> & { id: string | null }) => void;
  closeEditor: () => void;
  /** Workout being played, full screen. */
  playing: Workout | null;
  /** 'ramp' adds the FTP estimate at the end and a one-press stop. */
  playingMode: 'normal' | 'ramp';
  startWorkout: (workout: Workout, mode?: 'normal' | 'ramp') => void;
  stopPlayer: () => void;
  /** Result of asking the browser to keep our data; null until asked. */
  storagePersistence: StoragePersistence | null;
  setStoragePersistence: (value: StoragePersistence) => void;
  /** Route being ridden, full screen. */
  riding: { route: Route; mode: RideMode } | null;
  startRide: (route: Route, mode: RideMode) => void;
  stopRide: () => void;
  toast: { id: number; text: string } | null;
  showToast: (text: string) => void;
  hideToast: () => void;
}

/** Transient UI state. Not persisted. */
export const useUiStore = create<UiStore>()((set) => ({
  tab: 'library',
  setTab: (tab) => set({ tab }),
  editing: null,
  openEditor: (draft) => set({ editing: structuredClone(draft) }),
  closeEditor: () => set({ editing: null }),
  playing: null,
  playingMode: 'normal',
  startWorkout: (workout, mode = 'normal') => set({ playing: workout, playingMode: mode }),
  stopPlayer: () => set({ playing: null }),
  storagePersistence: null,
  setStoragePersistence: (value) => set({ storagePersistence: value }),
  riding: null,
  startRide: (route, mode) => set({ riding: { route, mode } }),
  stopRide: () => set({ riding: null }),
  toast: null,
  showToast: (text) => set({ toast: { id: Date.now(), text } }),
  hideToast: () => set({ toast: null }),
}));
