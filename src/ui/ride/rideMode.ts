import type { RideMode } from '../../domain/route/ride';
import type { SensorStatus } from '../../sensors/types';

export type RideReadiness = { ok: true; mode: RideMode } | { ok: false; missing: string[] };

/**
 * Routes always need a speed sensor. With a trainer curve the ride uses power and
 * physics; without one it moves by wheel speed and the slope is only shown.
 */
export function rideReadiness(hasCurve: boolean, speedSensor: SensorStatus): RideReadiness {
  if (speedSensor !== 'connected' && speedSensor !== 'reconnecting') {
    return { ok: false, missing: ['Conecta el sensor de velocidad en Sensores.'] };
  }
  return { ok: true, mode: hasCurve ? 'power' : 'wheel' };
}

export const RIDE_MODE_LABEL: Readonly<Record<RideMode, string>> = {
  power: 'Modo potencia',
  wheel: 'Modo velocidad de rueda · sin potencia',
};

export const RIDE_MODE_HINT: Readonly<Record<RideMode, string>> = {
  power: 'La velocidad sale de tu potencia estimada, tu peso y la pendiente.',
  wheel:
    'Sin rodillo elegido no hay potencia: avanzas a la velocidad de tu rueda y la pendiente solo se muestra.',
};
