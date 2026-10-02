import { create } from 'zustand';
import type { Workout } from '../domain/workout/types';
import type { StoragePersistence } from '../storage/persist';

export type Tab = 'library' | 'history' | 'sensors' | 'settings';

interface UiStore {
  tab: Tab;
  setTab: (tab: Tab) => void;
  /** Workout open in the editor. `id: null` means a new, unsaved workout. */
  editing: (Omit<Workout, 'id'> & { id: string | null }) | null;
  openEditor: (draft: Omit<Workout, 'id'> & { id: string | null }) => void;
  closeEditor: () => void;
  /** Workout being played, full screen. */
  playing: Workout | null;
  startWorkout: (workout: Workout) => void;
  stopPlayer: () => void;
  /** Result of asking the browser to keep our data; null until asked. */
  storagePersistence: StoragePersistence | null;
  setStoragePersistence: (value: StoragePersistence) => void;
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
  startWorkout: (workout) => set({ playing: workout }),
  stopPlayer: () => set({ playing: null }),
  storagePersistence: null,
  setStoragePersistence: (value) => set({ storagePersistence: value }),
  toast: null,
  showToast: (text) => set({ toast: { id: Date.now(), text } }),
  hideToast: () => set({ toast: null }),
}));
