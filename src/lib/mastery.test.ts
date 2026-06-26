import { describe, expect, it } from 'vitest';
import { masteryLevel, masteryMeta } from './mastery';

describe('mastery helpers', () => {
  it('uses the configured 50 and 75 percent thresholds', () => {
    expect(masteryLevel(49)).toBe('low');
    expect(masteryLevel(50)).toBe('medium');
    expect(masteryLevel(74)).toBe('medium');
    expect(masteryLevel(75)).toBe('high');
  });

  it('returns accessible labels for each mastery band', () => {
    expect(masteryMeta(20).label).toBe('Necesita refuerzo');
    expect(masteryMeta(60).label).toBe('Dominio medio');
    expect(masteryMeta(90).label).toBe('Buen dominio');
  });
});
