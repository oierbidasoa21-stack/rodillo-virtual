import type { SensorKind, SensorStatus } from '../../sensors/types';

export const SENSOR_NAME: Readonly<Record<SensorKind, string>> = {
  hr: 'Pulsómetro',
  csc: 'Velocidad y cadencia',
};

export const STATUS_LABEL: Readonly<Record<SensorStatus, string>> = {
  disconnected: 'Desconectado',
  connecting: 'Conectando…',
  connected: 'Conectado',
  reconnecting: 'Reconectando…',
  error: 'Error',
};

const oneDecimal = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** `22,4 km/h` */
export function formatSpeed(kmh: number): string {
  return `${oneDecimal.format(kmh)} km/h`;
}

/** `25,3` (ppm / 6, one decimal) */
export function formatPer10s(bpm: number): string {
  return oneDecimal.format(bpm / 6);
}
