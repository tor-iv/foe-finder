import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Email Verified Guard - Protects routes that require email verification
 *
 * This guard runs after authGuard and ensures the user has verified their email
 * before accessing protected routes like the questionnaire.
 *
 * If the user is logged in but hasn't verified their email, they are redirected
 * to the login page with a message prompting them to check their email.
 */
export const emailVerifiedGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.currentUser();

  if (!currentUser) {
    // Not logged in - let authGuard handle this
    return router.createUrlTree(['/login']);
  }

  if (currentUser.emailVerified) {
    // Email is verified - allow navigation
    return true;
  }

  // Email not verified - redirect to login with message
  // The login page will show the appropriate message
  return router.createUrlTree(['/login'], {
    queryParams: { message: 'verify-email' }
  });
};
