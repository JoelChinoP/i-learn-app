import { describe, expect, it } from 'vitest';
import { canAccessRole, rolePath } from './roles';

describe('role helpers', () => {
  it('maps each role to its dashboard route', () => {
    expect(rolePath('alumno')).toBe('/alumno');
    expect(rolePath('padre')).toBe('/padre');
    expect(rolePath('instructor')).toBe('/instructor');
  });

  it('allows access only to the matching role dashboard', () => {
    expect(canAccessRole('alumno', 'alumno')).toBe(true);
    expect(canAccessRole('padre', 'alumno')).toBe(false);
    expect(canAccessRole(undefined, 'instructor')).toBe(false);
  });
});
