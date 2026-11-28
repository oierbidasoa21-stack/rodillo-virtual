import { create } from 'zustand';
import type { RideMode } from '../domain/route/ride';
import type { Route } from '../domain/route/route';
import type { Workout } from '../domain/workout/types';
import type { SessionSnapshot } from '../recording/session';
import type { StoragePersistence } from '../storage/persist';

export type Tab = 'home' | 'library' | 'routes' | 'history' | 'sensors' | 'settings';

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
  /** Route the workout is ridden on, if any; it loops until the workout ends. */
  playingRoute: { route: Route; mode: RideMode } | null;
  startWorkout: (
    workout: Workout,
    mode?: 'normal' | 'ramp',
    route?: { route: Route; mode: RideMode } | null,
    resume?: SessionSnapshot | null,
  ) => void;
  stopPlayer: () => void;
  /** Result of asking the browser to keep our data; null until asked. */
  storagePersistence: StoragePersistence | null;
  setStoragePersistence: (value: StoragePersistence) => void;
  /** Route being ridden, full screen. */
  riding: { route: Route; mode: RideMode } | null;
  startRide: (route: Route, mode: RideMode, resume?: SessionSnapshot | null) => void;
  /** The open race view is the demo: simulated power, nothing saved. */
  demo: boolean;
  startDemo: (route: Route) => void;
  /** Saved session the open player or race view continues, if any. */
  resume: SessionSnapshot | null;
  stopRide: () => void;
  toast: { id: number; text: string } | null;
  showToast: (text: string) => void;
  hideToast: () => void;
}

/** Transient UI state. Not persisted. */
export const useUiStore = create<UiStore>()((set) => ({
  tab: 'home',
  setTab: (tab) => set({ tab }),
  editing: null,
  openEditor: (draft) => set({ editing: structuredClone(draft) }),
  closeEditor: () => set({ editing: null }),
  playing: null,
  playingMode: 'normal',
  playingRoute: null,
  startWorkout: (workout, mode = 'normal', route = null, resume = null) =>
    set({ playing: workout, playingMode: mode, playingRoute: route, resume }),
  stopPlayer: () => set({ playing: null, resume: null }),
  storagePersistence: null,
  setStoragePersistence: (value) => set({ storagePersistence: value }),
  riding: null,
  startRide: (route, mode, resume = null) => set({ riding: { route, mode }, resume, demo: false }),
  stopRide: () => set({ riding: null, resume: null, demo: false }),
  demo: false,
  startDemo: (route) => set({ riding: { route, mode: 'power' }, resume: null, demo: true }),
  resume: null,
  toast: null,
  showToast: (text) => set({ toast: { id: Date.now(), text } }),
  hideToast: () => set({ toast: null }),
}));
