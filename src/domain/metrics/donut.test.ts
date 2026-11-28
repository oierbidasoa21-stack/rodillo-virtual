import { describe, expect, it } from 'vitest';
import { donutSegments } from './donut';
import { emptySecByZone } from './timeInZone';

describe('zone donut', () => {
  it('worked by hand: 30′ Z2 and 10′ Z4 are three quarters and one quarter', () => {
    const s = donutSegments({ ...emptySecByZone(), Z2: 1800, Z4: 600 });
    expect(s.map((x) => x.id)).toEqual(['Z2', 'Z4']);
    expect(s[0]).toMatchObject({ share: 0.75, start: 0 });
    expect(s[1]).toMatchObject({ share: 0.25, start: 0.75 });
  });

  it('is empty with no time at all', () => {
    expect(donutSegments(emptySecByZone())).toEqual([]);
  });
});
