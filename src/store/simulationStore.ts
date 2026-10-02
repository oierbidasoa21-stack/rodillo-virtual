import { create } from 'zustand';

interface SimulationStore {
  targetBpm: number;
  /** In the player, aim the simulated heart rate at the middle of the current zone. */
  followZone: boolean;
  speedKmh: number;
  cadenceRpm: number;
  /** Off simulates a speed-only sensor. */
  cadenceEnabled: boolean;
  set: (patch: Partial<Omit<SimulationStore, 'set'>>) => void;
}

/** Controls for the simulated sensors. Not persisted: every page load starts from these. */
export const useSimulationStore = create<SimulationStore>()((set) => ({
  targetBpm: 130,
  followZone: true,
  speedKmh: 28,
  cadenceRpm: 88,
  cadenceEnabled: true,
  set: (patch) => set(patch),
}));
