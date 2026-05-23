'use client';

import { useAuth } from './useAuth';

/** Returns the list of role names for the current user */
export function useRoles(): string[] {
  const { user } = useAuth();
  if (!user) return [];
  return user.userRoles.map((ur) => ur.role.name);
}

/** Returns true if the current user has any of the given roles */
export function useHasRole(...roles: string[]): boolean {
  const userRoles = useRoles();
  return roles.some((r) => userRoles.includes(r));
}
