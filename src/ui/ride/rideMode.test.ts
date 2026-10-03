import { describe, expect, it } from 'vitest';
import { rideReadiness } from './rideMode';

describe('rideReadiness', () => {
  it('needs a speed sensor', () => {
    expect(rideReadiness(true, 'disconnected')).toEqual({
      ok: false,
      missing: ['Conecta el sensor de velocidad en Sensores.'],
    });
  });

  it('uses power with a trainer curve, wheel speed without', () => {
    expect(rideReadiness(true, 'connected')).toEqual({ ok: true, mode: 'power' });
    expect(rideReadiness(false, 'connected')).toEqual({ ok: true, mode: 'wheel' });
    expect(rideReadiness(false, 'reconnecting')).toEqual({ ok: true, mode: 'wheel' });
  });
});
