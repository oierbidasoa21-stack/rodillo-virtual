import { describe, expect, it } from 'vitest';
import { GRAPHICS_QUALITIES, QUALITY_PRESETS, isGraphicsQuality, thin } from './quality';

describe('graphics quality presets', () => {
  it('draw more from low to high', () => {
    const { low, medium, high } = QUALITY_PRESETS;
    for (const key of ['propDensity', 'crowdDensity', 'farM', 'maxDpr', 'shadowMapPx'] as const) {
      expect(low[key]).toBeLessThan(medium[key]);
      expect(medium[key]).toBeLessThan(high[key]);
    }
    expect(low.shadows).toBe(false);
    expect(high.shadows).toBe(true);
  });

  it('keep the haze inside the far plane, so the world never ends in a hard edge', () => {
    for (const q of GRAPHICS_QUALITIES) {
      expect(QUALITY_PRESETS[q].fogEndM).toBeLessThan(QUALITY_PRESETS[q].farM);
    }
  });

  it('high is what the 3D view drew before', () => {
    expect(QUALITY_PRESETS.high).toMatchObject({ propDensity: 1, crowdDensity: 1, farM: 8000 });
  });

  it('recognises only the three levels', () => {
    expect(isGraphicsQuality('medium')).toBe(true);
    expect(isGraphicsQuality('ultra')).toBe(false);
    expect(isGraphicsQuality(undefined)).toBe(false);
  });
});

describe('thin', () => {
  const items = Array.from({ length: 1000 }, (_, i) => i);

  it('keeps about the asked share', () => {
    expect(thin(items, 0.35).length).toBeGreaterThan(330);
    expect(thin(items, 0.35).length).toBeLessThan(370);
    expect(thin(items, 1)).toEqual(items);
    expect(thin(items, 0)).toEqual([]);
  });

  it('is deterministic and spread over the whole list', () => {
    const a = thin(items, 0.3);
    expect(a).toEqual(thin(items, 0.3));
    // Every tenth of the list keeps roughly its share (props along the whole road).
    for (let k = 0; k < 10; k++) {
      const n = a.filter((i) => i >= k * 100 && i < (k + 1) * 100).length;
      expect(n).toBeGreaterThan(20);
      expect(n).toBeLessThan(40);
    }
  });

  it('keeps what a lower level keeps (raising the level only adds props)', () => {
    const low = new Set(thin(items, 0.35));
    const medium = new Set(thin(items, 0.65));
    for (const i of low) expect(medium.has(i)).toBe(true);
  });
});
