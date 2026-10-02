import { create } from 'zustand';
import type { Workout } from '../domain/workout/types';

export type Tab = 'library' | 'history' | 'settings';

interface UiStore {
  tab: Tab;
  setTab: (tab: Tab) => void;
  /** Workout open in the editor. `id: null` means a new, unsaved workout. */
  editing: (Omit<Workout, 'id'> & { id: string | null }) | null;
  openEditor: (draft: Omit<Workout, 'id'> & { id: string | null }) => void;
  closeEditor: () => void;
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
  toast: null,
  showToast: (text) => set({ toast: { id: Date.now(), text } }),
  hideToast: () => set({ toast: null }),
}));
