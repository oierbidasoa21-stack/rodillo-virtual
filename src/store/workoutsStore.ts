import { create } from 'zustand';
import type { Workout } from '../domain/workout/types';
import { storage } from '../storage/repositories';

interface WorkoutsStore {
  /** The user's own workouts (built-in ones live in domain/workout/library). */
  custom: Workout[];
  loaded: boolean;
  load: () => Promise<void>;
  save: (workout: Workout) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useWorkoutsStore = create<WorkoutsStore>()((set, get) => ({
  custom: [],
  loaded: false,
  load: async () => {
    set({ custom: await storage.listWorkouts(), loaded: true });
  },
  save: async (workout) => {
    const exists = get().custom.some((w) => w.id === workout.id);
    set({
      custom: exists
        ? get().custom.map((w) => (w.id === workout.id ? workout : w))
        : [...get().custom, workout],
    });
    await storage.saveWorkout(workout);
  },
  remove: async (id) => {
    set({ custom: get().custom.filter((w) => w.id !== id) });
    await storage.deleteWorkout(id);
  },
}));
