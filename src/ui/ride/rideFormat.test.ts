import { describe, expect, it } from 'vitest';
import { formatGrade, formatKm, gradeColor } from './rideFormat';

describe('ride formats', () => {
  it('formats distance and gradient in Spanish', () => {
    expect(formatKm(12_345)).toBe('12,3 km');
    expect(formatGrade(0.0623)).toBe('+6,2 %');
    expect(formatGrade(-0.03)).toBe('−3,0 %');
    expect(formatGrade(0.0004)).toBe('0,0 %');
  });

  it('colours gradients by difficulty', () => {
    expect(gradeColor(-0.05)).toBe('var(--z1)');
    expect(gradeColor(0.03)).toBe('var(--z3)');
    expect(gradeColor(0.06)).toBe('var(--z4)');
    expect(gradeColor(0.1)).toBe('var(--z5)');
    // 4.9999 % from floating point is still 5 %
    expect(gradeColor(0.049999)).toBe('var(--z4)');
  });
});
