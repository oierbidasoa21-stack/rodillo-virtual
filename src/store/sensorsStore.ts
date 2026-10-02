import { create } from 'zustand';
import type { ReadingByKind, SensorKind, SensorSource, SensorStatus } from '../sensors/types';

export interface SensorState<K extends SensorKind> {
  status: SensorStatus;
  source: SensorSource | null;
  deviceName: string | null;
  error: string | null;
  last: ReadingByKind[K] | null;
}

interface SensorsStore {
  hr: SensorState<'hr'>;
  csc: SensorState<'csc'>;
  patch: <K extends SensorKind>(kind: K, patch: Partial<SensorState<K>>) => void;
}

const idle = <K extends SensorKind>(): SensorState<K> => ({
  status: 'disconnected',
  source: null,
  deviceName: null,
  error: null,
  last: null,
});

/** Live state of each sensor for the UI. Fed by the sensor manager; not persisted. */
export const useSensorsStore = create<SensorsStore>()((set) => ({
  hr: idle<'hr'>(),
  csc: idle<'csc'>(),
  patch: (kind, patch) =>
    set((s) => ({ [kind]: { ...s[kind], ...patch } }) as Partial<SensorsStore>),
}));
