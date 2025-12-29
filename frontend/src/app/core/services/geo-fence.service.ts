import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';

/**
 * GeoFenceService - Manages location-based access restrictions
 *
 * Restricts app access to users within the NYC metropolitan area.
 * Users outside the geo-fence are shown a waitlist signup.
 *
 * Flow:
 * 1. Check localStorage for cached verification (valid 24 hours)
 * 2. If no cache or expired, request GPS location
 * 3. Check if coordinates fall within NYC bounding box
 * 4. Cache successful verification in localStorage
 * 5. Users outside NYC can join waitlist
 */
@Injectable({ providedIn: 'root' })
export class GeoFenceService {
  private supabaseService = inject(SupabaseService);

  private readonly GEO_FENCE_ENABLED = environment.features.geoFenceEnabled;
  private readonly STORAGE_KEY = 'foe-geo-verified';
  private readonly STORAGE_DATE_KEY = 'foe-geo-verified-date';
  private readonly VERIFICATION_EXPIRY_HOURS = 24;

  // NYC bounding box (all 5 boroughs + buffer)
  private readonly NYC_BOUNDS = {
    north: 40.917577,  // Northern Bronx
    south: 40.477399,  // Southern Staten Island
    west: -74.259090,  // Western Staten Island/NJ edge
    east: -73.700272   // Eastern Queens/Nassau border
  };

  // Reactive signals for UI binding
  // null = not yet checked, true = in NYC, false = outside NYC or error
  geoVerified = signal<boolean | null>(null);
  geoCheckInProgress = signal(false);
  geoError = signal<string | null>(null);

  constructor() {
    if (this.GEO_FENCE_ENABLED) {
      this.initializeFromLocalStorage();
    } else {
      // If geo-fence disabled, mark as verified
      this.geoVerified.set(true);
    }
  }

  /**
   * Check if geo-fence feature is enabled
   */
  isEnabled(): boolean {
    return this.GEO_FENCE_ENABLED;
  }

  /**
   * Check localStorage for existing verification
   */
  private initializeFromLocalStorage(): void {
    if (this.isCacheValid()) {
      this.geoVerified.set(true);
    }
    // If cache invalid or missing, leave as null (will trigger verification)
  }

  /**
   * Check if cached verification is still valid (within 24 hours)
   */
  private isCacheValid(): boolean {
    const verified = localStorage.getItem(this.STORAGE_KEY) === 'true';
    const dateStr = localStorage.getItem(this.STORAGE_DATE_KEY);

    if (!verified || !dateStr) {
      return false;
    }

    const verifiedDate = new Date(dateStr);
    const now = new Date();
    const hoursDiff = (now.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60);

    return hoursDiff < this.VERIFICATION_EXPIRY_HOURS;
  }

  /**
   * Main verification method - requests GPS and checks bounds
   * @returns true if user is within NYC, false otherwise
   */
  async verifyLocation(): Promise<boolean> {
    if (!this.GEO_FENCE_ENABLED) {
      this.geoVerified.set(true);
      return true;
    }

    // Check cache first
    if (this.isCacheValid()) {
      this.geoVerified.set(true);
      return true;
    }

    this.geoCheckInProgress.set(true);
    this.geoError.set(null);

    try {
      const position = await this.getCurrentPosition();
      const { latitude, longitude } = position.coords;
      const isInNYC = this.isWithinNYC(latitude, longitude);

      if (isInNYC) {
        this.storeVerification();
        this.geoVerified.set(true);
      } else {
        this.geoVerified.set(false);
        this.geoError.set('outside_nyc');
      }

      return isInNYC;
    } catch (error) {
      this.handleGeolocationError(error as GeolocationPositionError);
      this.geoVerified.set(false);
      return false;
    } finally {
      this.geoCheckInProgress.set(false);
    }
  }

  /**
   * Wrap navigator.geolocation.getCurrentPosition in a Promise
   */
  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject({ code: 2, message: 'Geolocation not supported' } as GeolocationPositionError);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Handle geolocation errors
   */
  private handleGeolocationError(error: GeolocationPositionError): void {
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        this.geoError.set('permission_denied');
        break;
      case 2: // POSITION_UNAVAILABLE
        this.geoError.set('position_unavailable');
        break;
      case 3: // TIMEOUT
        this.geoError.set('timeout');
        break;
      default:
        this.geoError.set('unknown');
    }
    console.error('Geolocation error:', error.message);
  }

  /**
   * Check if coordinates are within NYC bounds
   */
  private isWithinNYC(lat: number, lng: number): boolean {
    return (
      lat >= this.NYC_BOUNDS.south &&
      lat <= this.NYC_BOUNDS.north &&
      lng >= this.NYC_BOUNDS.west &&
      lng <= this.NYC_BOUNDS.east
    );
  }

  /**
   * Store successful verification in localStorage
   */
  private storeVerification(): void {
    localStorage.setItem(this.STORAGE_KEY, 'true');
    localStorage.setItem(this.STORAGE_DATE_KEY, new Date().toISOString());
  }

  /**
   * Clear cached verification (for testing/retry)
   */
  clearVerification(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STORAGE_DATE_KEY);
    this.geoVerified.set(null);
    this.geoError.set(null);
  }

  /**
   * Submit email to waitlist for users outside NYC
   */
  async submitToWaitlist(
    email: string,
    coords?: { latitude: number; longitude: number }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabaseService.client
        .from('waitlist')
        .insert({
          email,
          latitude: coords?.latitude || null,
          longitude: coords?.longitude || null
        });

      if (error) {
        // Handle duplicate email
        if (error.code === '23505') {
          return { success: false, error: 'already_registered' };
        }
        console.error('Failed to submit to waitlist:', error);
        return { success: false, error: 'database_error' };
      }

      return { success: true };
    } catch (err) {
      console.error('Error submitting to waitlist:', err);
      return { success: false, error: 'network_error' };
    }
  }
}
