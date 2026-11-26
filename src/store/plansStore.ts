import { create } from 'zustand';
import type { TrainingPlan } from '../domain/plan/plan';
import { storage } from '../storage/repositories';

interface PlansStore {
  /** Plans imported from the coaching agent, oldest first. */
  plans: TrainingPlan[];
  loaded: boolean;
  load: () => Promise<void>;
  save: (plan: TrainingPlan) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const usePlansStore = create<PlansStore>()((set, get) => ({
  plans: [],
  loaded: false,
  load: async () => {
    const plans = await storage.listPlans();
    set({ plans: plans.sort((a, b) => a.importedAtMs - b.importedAtMs), loaded: true });
  },
  save: async (plan) => {
    set({ plans: [...get().plans.filter((p) => p.id !== plan.id), plan] });
    await storage.savePlan(plan);
  },
  remove: async (id) => {
    set({ plans: get().plans.filter((p) => p.id !== id) });
    await storage.deletePlan(id);
  },
}));
