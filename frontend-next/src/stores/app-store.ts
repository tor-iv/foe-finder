import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect, useState } from 'react';

// ==============================================
// Types
// ==============================================

interface AppState {
  // Intro splash screen
  introSeen: boolean;
  markIntroSeen: () => void;

  // Age verification (21+)
  ageVerified: boolean;
  verifyAge: (birthDate: Date) => boolean;
  clearAgeVerification: () => void;

  // Geo-fence (NYC only)
  geoVerified: boolean | null;
  geoCheckInProgress: boolean;
  geoError: string | null;
  setGeoVerified: (verified: boolean) => void;
  setGeoCheckInProgress: (inProgress: boolean) => void;
  setGeoError: (error: string | null) => void;
  clearGeoVerification: () => void;
}

// ==============================================
// Constants
// ==============================================

const MINIMUM_AGE = 21;

// SSR-safe storage: no-op storage for server-side rendering
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};
const GEO_VERIFICATION_EXPIRY_HOURS = 24;

// NYC Bounding Box
const NYC_BOUNDS = {
  north: 40.917577,
  south: 40.477399,
  west: -74.25909,
  east: -73.700272,
};

// ==============================================
// Store
// ==============================================

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Intro
      introSeen: false,
      markIntroSeen: () => set({ introSeen: true }),

      // Age verification
      ageVerified: false,
      verifyAge: (birthDate: Date) => {
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();

        const actualAge =
          monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

        const isVerified = actualAge >= MINIMUM_AGE;
        set({ ageVerified: isVerified });
        return isVerified;
      },
      clearAgeVerification: () => set({ ageVerified: false }),

      // Geo-fence
      geoVerified: null,
      geoCheckInProgress: false,
      geoError: null,
      setGeoVerified: (verified: boolean) =>
        set({ geoVerified: verified, geoError: null }),
      setGeoCheckInProgress: (inProgress: boolean) =>
        set({ geoCheckInProgress: inProgress }),
      setGeoError: (error: string | null) => set({ geoError: error }),
      clearGeoVerification: () =>
        set({ geoVerified: null, geoError: null }),
    }),
    {
      name: 'foe-finder-app',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : noopStorage
      ),
      partialize: (state) => ({
        introSeen: state.introSeen,
        ageVerified: state.ageVerified,
        geoVerified: state.geoVerified,
      }),
    }
  )
);

// ==============================================
// Geo-fence helper
// ==============================================

export function isInNYC(latitude: number, longitude: number): boolean {
  return (
    latitude >= NYC_BOUNDS.south &&
    latitude <= NYC_BOUNDS.north &&
    longitude >= NYC_BOUNDS.west &&
    longitude <= NYC_BOUNDS.east
  );
}

export async function checkGeoLocation(): Promise<{
  inNYC: boolean;
  error?: string;
}> {
  // SSR guard: geolocation only available in browser
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return { inNYC: false, error: 'Geolocation is not supported' };
  }

  return new Promise((resolve) => {

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const inNYC = isInNYC(latitude, longitude);
        resolve({ inNYC });
      },
      (error) => {
        let errorMessage = 'Unable to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        resolve({ inNYC: false, error: errorMessage });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: GEO_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000,
      }
    );
  });
}

// ==============================================
// Hydration Hook
// ==============================================

export function useAppStoreHydrated() {
  // Initialize with current hydration state to avoid synchronous setState in effect
  const [hydrated, setHydrated] = useState(() => useAppStore.persist.hasHydrated());

  useEffect(() => {
    // If already hydrated, nothing to do
    if (hydrated) return;

    // Wait for zustand to hydrate from localStorage
    const unsubscribe = useAppStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    return () => {
      unsubscribe();
    };
  }, [hydrated]);

  return hydrated;
}
