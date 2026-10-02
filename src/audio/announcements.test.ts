import { describe, expect, it } from 'vitest';
import { makeBlock } from '../domain/workout/types';
import { announceStep, announceWarning } from './announcements';

describe('announcements', () => {
  it('reads kind, zone and duration', () => {
    expect(announceStep(makeBlock(600, 'UA', 'work'))).toBe('Serie, umbral, 10 minutos');
    expect(announceStep(makeBlock(60, 'L1', 'rec'))).toBe('Recuperación, L uno, 1 minuto');
    expect(announceStep(makeBlock(30, 'VO2', 'work'))).toBe('Serie, VO dos, 30 segundos');
  });

  it('warns about the next step or the end', () => {
    expect(announceWarning(makeBlock(240, 'UA+', 'work'))).toBe(
      'En diez segundos: serie, umbral más',
    );
    expect(announceWarning(null)).toBe('Diez segundos para terminar');
  });
});
