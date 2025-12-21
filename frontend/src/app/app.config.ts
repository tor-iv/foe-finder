import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { transcriptionProviders } from './core/services/transcription';

/**
 * Application configuration
 *
 * This is where we configure all the providers for our Angular application.
 * We've removed Firebase and will use Supabase instead (via SupabaseService).
 *
 * Key providers:
 * - provideZoneChangeDetection: Enables Angular's change detection with Zone.js
 *   The eventCoalescing option batches multiple events together for better performance
 * - provideRouter: Sets up the Angular router with our defined routes
 * - provideAnimationsAsync: Enables Angular Material animations (loaded asynchronously)
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    ...transcriptionProviders
  ]
};
