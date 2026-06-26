import { describe, expect, it } from 'vitest';
import { clampPercent, unitToPercent } from './scale';

describe('scale helpers', () => {
  it('converts database unit mastery values to UI percentages', () => {
    expect(unitToPercent(0)).toBe(0);
    expect(unitToPercent(0.75)).toBe(75);
    expect(unitToPercent(1)).toBe(100);
  });

  it('clamps unsafe percentage values before rendering', () => {
    expect(clampPercent(-10)).toBe(0);
    expect(clampPercent(120)).toBe(100);
    expect(clampPercent(Number.NaN)).toBe(0);
  });
});
