import type { SensorKind } from './types';

const KEY = 'rodillo-virtual:remembered-sensors';

/**
 * Chrome's id of the last sensor chosen of each kind, to reconnect without the
 * chooser where Chrome allows it. Kept in localStorage on purpose: it is a
 * convenience that only means something to this browser and this site, not a
 * piece of data worth a database row or a backup. Losing it just means pressing
 * Conectar again.
 */
export function rememberedSensor(kind: SensorKind): string | null {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, unknown>;
    const id = all[kind];
    return typeof id === 'string' ? id : null;
  } catch {
    return null;
  }
}

export function rememberSensor(kind: SensorKind, id: string | null): void {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, unknown>;
    if (id) all[kind] = id;
    else delete all[kind];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Private window or storage blocked: nothing is remembered.
  }
}
