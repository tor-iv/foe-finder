import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard - Protects routes that require authentication
 *
 * A guard is a function that runs before a route is activated. It returns:
 * - true: Allow navigation to proceed
 * - false: Block navigation
 * - UrlTree: Redirect to a different route
 *
 * This guard checks if a user is logged in. If not, it redirects to /login.
 *
 * Angular Concept: CanActivateFn
 * This is a functional guard (introduced in Angular 14+). It's simpler than
 * class-based guards and uses the inject() function for dependency injection.
 *
 * Usage in routes:
 * {
 *   path: 'protected-page',
 *   component: ProtectedComponent,
 *   canActivate: [authGuard]  // <-- Add the guard here
 * }
 */
export const authGuard: CanActivateFn = () => {
  // inject() gets services from Angular's dependency injection system
  // This works because guards run within Angular's injection context
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is logged in using the signal
  // currentUser() returns the current value of the signal
  const currentUser = authService.currentUser();

  if (currentUser) {
    // User is logged in - allow navigation
    return true;
  } else {
    // User is not logged in - redirect to login page
    // router.createUrlTree creates a URL for navigation
    // This is preferred over router.navigate() in guards because
    // it properly integrates with the router's navigation cycle
    return router.createUrlTree(['/login']);
  }
};
