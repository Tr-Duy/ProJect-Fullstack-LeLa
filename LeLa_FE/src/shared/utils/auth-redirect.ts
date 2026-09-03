/**
 * Centralized Post-Login and Route Navigation Decision Logic
 *
 * Rules:
 * 1. Guest / No User: '/login'
 * 2. Admin / Staff (ADMIN, CONTENT_CREATOR, MODERATOR): '/admin/dashboard'
 * 3. Learner:
 *    - Profile not loaded yet (currentLevel === undefined): returns null (MUST wait for complete profile)
 *    - Has currentLevel (currentLevel !== null): '/dashboard'
 *    - Has completed placement (placementCompleted === true): '/dashboard'
 *    - New learner (currentLevel === null AND placementCompleted !== true): '/onboarding'
 * 4. Fallback: '/dashboard'
 */

export interface ResolvableUser {
  id?: number;
  roles?: string[];
  role?: string;
  currentLevel?: any;
  placementCompleted?: boolean;
}

export function resolvePostLoginRedirect(user: ResolvableUser | null | undefined): string | null {
  if (!user) {
    return '/login';
  }

  const roles: string[] = Array.isArray(user.roles)
    ? user.roles
    : (typeof user.role === 'string' ? [user.role] : []);

  const hasAdminRole = roles.some((r: string) =>
    ['ADMIN', 'CONTENT_CREATOR', 'MODERATOR'].includes(r)
  );

  if (hasAdminRole) {
    if (import.meta.env.DEV) {
      console.log('[POST LOGIN REDIRECT]', {
        role: roles.join(', ') || 'ADMIN',
        currentLevel: user.currentLevel?.name || user.currentLevel?.code || null,
        placementCompleted: user.placementCompleted ?? null,
        target: '/admin/dashboard',
      });
    }
    return '/admin/dashboard';
  }

  const isLearner = roles.includes('LEARNER') || roles.length === 0;
  if (isLearner) {
    // If profile is still undefined/unloaded, do NOT prematurely assume null or send to /onboarding
    if (user.currentLevel === undefined && user.placementCompleted === undefined) {
      if (import.meta.env.DEV) {
        console.log('[POST LOGIN REDIRECT] Profile is still loading (currentLevel is undefined), waiting for profile.');
      }
      return null;
    }

    const hasCurrentLevel = user.currentLevel !== null && user.currentLevel !== undefined;
    const isPlacementCompleted = Boolean(user.placementCompleted);

    const target = (hasCurrentLevel || isPlacementCompleted) ? '/dashboard' : '/onboarding';

    if (import.meta.env.DEV) {
      console.log('[POST LOGIN REDIRECT]', {
        role: roles.join(', ') || 'LEARNER',
        currentLevel: user.currentLevel?.name || user.currentLevel?.code || null,
        placementCompleted: isPlacementCompleted,
        target,
      });
    }

    return target;
  }

  return '/dashboard';
}
