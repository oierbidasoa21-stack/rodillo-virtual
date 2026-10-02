import { describe, expect, it } from 'vitest';
import { formatClock, formatMinutes, zoneBounds, zoneBpmText, zoneRangeText } from './format';

describe('formatClock', () => {
  it('formats minutes and hours', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(3725)).toBe('1:02:05');
  });

  it('rounds and never goes negative', () => {
    expect(formatClock(59.6)).toBe('1:00');
    expect(formatClock(-3)).toBe('0:00');
  });
});

describe('formatMinutes', () => {
  it('formats short and long durations', () => {
    expect(formatMinutes(45 * 60)).toBe('45′');
    expect(formatMinutes(67 * 60)).toBe('1 h 07′');
  });
});

describe('zone texts', () => {
  const l3 = { id: 'L3', label: 'L3', min: 24, max: 25 } as const;
  const uap = { id: 'UA+', label: 'UA+', min: 28, max: 28 } as const;
  const vo2 = { id: 'VO2', label: 'VO2', min: 29, max: null } as const;

  it('formats ranges, single values and open ends', () => {
    expect(zoneBounds(l3)).toBe('24–25');
    expect(zoneRangeText(uap)).toBe('28 /10″');
    expect(zoneRangeText(vo2)).toBe('29+ /10″');
  });

  it('converts to bpm (× 6)', () => {
    expect(zoneBpmText(l3)).toBe('144–150 ppm');
    expect(zoneBpmText(uap)).toBe('168 ppm');
    expect(zoneBpmText(vo2)).toBe('174+ ppm');
  });
});
