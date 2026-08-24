'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { authClient } from '@/lib/auth-client';
import { User } from '@/types';

// ==============================================
// Types
// ==============================================

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  emailVerificationPending: boolean;
}

interface AuthActions {
  login: (
    email: string,
    password: string
  ) => Promise<{ error?: string; twoFactorRequired?: boolean }>;
  verifyTwoFactor: (code: string) => Promise<{ error?: string }>;
  register: (
    email: string,
    password: string,
    displayName: string,
    marketingConsent: boolean
  ) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error?: string }>;
  updatePassword: (newPassword: string, token: string) => Promise<{ error?: string }>;
  refreshUser: () => Promise<void>;
}

type AuthContextType = AuthState & AuthActions;

// ==============================================
// Context
// ==============================================

const AuthContext = createContext<AuthContextType | null>(null);

// ==============================================
// Helper Functions
// ==============================================

interface BetterAuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  isAdmin?: boolean | null;
  hasCompletedQuestionnaire?: boolean | null;
  twoFactorEnabled?: boolean | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

async function fetchIsMatched(): Promise<boolean> {
  try {
    const res = await fetch('/api/match');
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.match;
  } catch {
    return false;
  }
}

async function mapSessionUserToUser(sessionUser: BetterAuthUser): Promise<User> {
  const isMatched = await fetchIsMatched();

  return {
    uid: sessionUser.id,
    email: sessionUser.email,
    displayName: sessionUser.name || sessionUser.email.split('@')[0],
    emailVerified: sessionUser.emailVerified,
    hasCompletedQuestionnaire: !!sessionUser.hasCompletedQuestionnaire,
    isMatched,
    isAdmin: !!sessionUser.isAdmin,
    twoFactorEnabled: !!sessionUser.twoFactorEnabled,
    createdAt: new Date(sessionUser.createdAt),
    updatedAt: new Date(sessionUser.updatedAt),
  };
}

// ==============================================
// Provider
// ==============================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailVerificationPending, setEmailVerificationPending] = useState(false);

  const loadUser = useCallback(async () => {
    const { data } = await authClient.getSession();
    if (data?.user) {
      setUser(await mapSessionUserToUser(data.user as BetterAuthUser));
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await loadUser();
      if (!cancelled) setIsLoading(false);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [loadUser]);

  // ==============================================
  // Auth Actions
  // ==============================================

  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ error?: string; twoFactorRequired?: boolean }> => {
      setIsLoading(true);

      try {
        const { data, error } = await authClient.signIn.email({ email, password });

        if (error) {
          return { error: error.message };
        }

        if (data && 'twoFactorRedirect' in data && data.twoFactorRedirect) {
          return { twoFactorRequired: true };
        }

        await loadUser();
        return {};
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An error occurred';
        return { error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [loadUser]
  );

  const verifyTwoFactor = useCallback(
    async (code: string): Promise<{ error?: string }> => {
      setIsLoading(true);
      try {
        const { error } = await authClient.twoFactor.verifyTotp({ code });
        if (error) {
          return { error: error.message };
        }
        await loadUser();
        return {};
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An error occurred';
        return { error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [loadUser]
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      marketingConsent: boolean
    ): Promise<{ error?: string }> => {
      setIsLoading(true);

      try {
        const { data, error } = await authClient.signUp.email({
          email,
          password,
          name: displayName,
          marketingConsent,
          callbackURL: '/verify-email',
        } as Parameters<typeof authClient.signUp.email>[0]);

        if (error) {
          return { error: error.message };
        }

        if (data?.user && !data.user.emailVerified) {
          setEmailVerificationPending(true);
        }

        return {};
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An error occurred';
        return { error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authClient.signOut();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestPasswordReset = useCallback(
    async (email: string): Promise<{ error?: string }> => {
      try {
        const { error } = await authClient.requestPasswordReset({
          email,
          redirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/reset-password`
              : undefined,
        });

        if (error) {
          return { error: error.message };
        }

        return {};
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An error occurred';
        return { error: message };
      }
    },
    []
  );

  const updatePassword = useCallback(
    async (newPassword: string, token: string): Promise<{ error?: string }> => {
      try {
        const { error } = await authClient.resetPassword({
          newPassword,
          token,
        });

        if (error) {
          return { error: error.message };
        }

        return {};
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An error occurred';
        return { error: message };
      }
    },
    []
  );

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  // ==============================================
  // Context Value
  // ==============================================

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    emailVerificationPending,
    login,
    verifyTwoFactor,
    register,
    logout,
    requestPasswordReset,
    updatePassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ==============================================
// Hook
// ==============================================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
