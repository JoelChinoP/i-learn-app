import type { Role } from './types';

export function rolePath(role: Role): string {
  return role === 'alumno' ? '/alumno' : role === 'padre' ? '/padre' : '/instructor';
}

export function canAccessRole(profileRole: Role | null | undefined, requiredRole: Role): boolean {
  return profileRole === requiredRole;
}
