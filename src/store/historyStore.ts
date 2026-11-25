import { create } from 'zustand';
import type { SessionSummary } from '../domain/metrics/summary';
import { storage } from '../storage/repositories';

interface HistoryStore {
  /** Oldest first. */
  sessions: SessionSummary[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (session: SessionSummary) => Promise<void>;
  clear: () => Promise<void>;
  /** Deletes one session and its recording. */
  remove: (id: string) => Promise<void>;
}

export const useHistoryStore = create<HistoryStore>()((set, get) => ({
  sessions: [],
  loaded: false,
  load: async () => {
    set({ sessions: await storage.listHistory(), loaded: true });
  },
  add: async (session) => {
    set({ sessions: [...get().sessions, session] });
    await storage.addHistory(session);
  },
  clear: async () => {
    set({ sessions: [] });
    await storage.clearHistory();
  },
  remove: async (id) => {
    set({ sessions: get().sessions.filter((s) => s.id !== id) });
    await storage.deleteSession(id);
  },
}));
