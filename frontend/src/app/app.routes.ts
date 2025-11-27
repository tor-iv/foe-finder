import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

/**
 * Application Routes Configuration
 *
 * This defines all the routes (URLs) in our application and which components
 * they load. Angular's router uses this configuration to:
 * - Match URLs to components
 * - Lazy load components (only load when needed)
 * - Protect routes with guards
 *
 * Key concepts:
 * - path: The URL segment (e.g., 'login' matches /login)
 * - loadComponent: Lazy loads the component (better performance)
 * - canActivate: Guards that run before allowing navigation
 * - redirectTo: Redirects to another path
 * - pathMatch: 'full' means the entire URL must match
 */
export const routes: Routes = [
  // Default route - redirect to login
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },

  // Public routes (no authentication required)
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register.component').then(m => m.RegisterComponent)
  },

  // Protected routes (requires authentication)
  {
    path: 'questionnaire',
    loadComponent: () =>
      import('./features/questionnaire/questionnaire.component').then(m => m.QuestionnaireComponent),
    canActivate: [authGuard]
  },
  {
    path: 'results',
    loadComponent: () =>
      import('./features/results/results.component').then(m => m.ResultsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },

  // Wildcard route - catch all unknown routes and redirect to login
  {
    path: '**',
    redirectTo: '/login'
  }
];
