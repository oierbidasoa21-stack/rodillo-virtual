import type { ZoneStatus } from '../../domain/zones/zones';

export const STATUS_CLASS: Readonly<Record<ZoneStatus, string>> = {
  in: 'st-ok',
  above: 'st-hi',
  below: 'st-lo',
};

export const STATUS_TEXT: Readonly<Record<ZoneStatus, string>> = {
  in: 'En zona',
  above: 'Por encima',
  below: 'Por debajo',
};
