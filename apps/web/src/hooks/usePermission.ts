'use client';

import { useAuth } from './useAuth';

/** Returns true if the current user has the given permission on any of their roles */
export function usePermission(action: string, resource: string): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return user.userRoles.some((ur) =>
    ur.role.permissions.some(
      (p) => p.action === action && p.resource === resource,
    ),
  );
}
