import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Admin Guard - Protects routes that require admin privileges
 *
 * This guard checks if:
 * 1. User is logged in (delegates to authGuard first in route config)
 * 2. User has isAdmin = true
 *
 * If user is logged in but not an admin, redirects to /profile
 * If user is not logged in, redirects to /login
 *
 * Usage in routes:
 * {
 *   path: 'admin',
 *   component: AdminComponent,
 *   canActivate: [authGuard, adminGuard]  // authGuard runs first
 * }
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.currentUser();

  // If no user, redirect to login
  if (!currentUser) {
    return router.createUrlTree(['/login']);
  }

  // If user is admin, allow access
  if (currentUser.isAdmin) {
    return true;
  }

  // Non-admin users get redirected to profile
  return router.createUrlTree(['/profile']);
};
