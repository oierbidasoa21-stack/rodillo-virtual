import { describe, expect, it } from 'vitest';
import { makeBlock } from '../domain/workout/types';
import { announceRampStep, announceStep, announceWarning } from './announcements';

describe('announcements', () => {
  it('reads kind, zone and duration', () => {
    expect(announceStep(makeBlock(600, 'Z4', 'work'))).toBe('Serie, zona cuatro, 10 minutos');
    expect(announceStep(makeBlock(60, 'Z1', 'rec'))).toBe('Recuperación, zona uno, 1 minuto');
    expect(announceStep(makeBlock(30, 'Z6', 'work'))).toBe('Serie, zona seis, 30 segundos');
  });

  it('reads power targets', () => {
    expect(announceStep(makeBlock(600, { type: 'power', pctFtp: 88 }, 'work'))).toBe(
      'Serie, 88 por ciento, 10 minutos',
    );
    // 88 % of 240 W = 211.2 → 211
    expect(announceStep(makeBlock(600, { type: 'power', pctFtp: 88 }, 'work'), 240)).toBe(
      'Serie, 88 por ciento, 211 vatios, 10 minutos',
    );
    expect(announceRampStep(240)).toBe('Sube a 240 vatios');
  });

  it('warns about the next step or the end', () => {
    expect(announceWarning(makeBlock(240, 'Z5', 'work'))).toBe(
      'En diez segundos: serie, zona cinco',
    );
    expect(announceWarning(null)).toBe('Diez segundos para terminar');
  });
});
