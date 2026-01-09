'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  User as SupabaseUser,
  AuthChangeEvent,
  Session,
} from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
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
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (
    email: string,
    password: string,
    displayName: string,
    marketingConsent: boolean
  ) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
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

function mapSupabaseUserToUser(
  supabaseUser: SupabaseUser,
  profile?: {
    display_name?: string;
    has_completed_questionnaire?: boolean;
    match_id?: string;
    is_admin?: boolean;
  }
): User {
  return {
    uid: supabaseUser.id,
    email: supabaseUser.email || '',
    displayName:
      profile?.display_name ||
      supabaseUser.user_metadata?.display_name ||
      supabaseUser.email?.split('@')[0] ||
      'User',
    emailVerified: supabaseUser.email_confirmed_at !== null,
    hasCompletedQuestionnaire: profile?.has_completed_questionnaire || false,
    isMatched: !!profile?.match_id,
    isAdmin: profile?.is_admin || false,
    createdAt: new Date(supabaseUser.created_at),
    updatedAt: new Date(),
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

  // Flag to prevent auth state change listener from interfering with manual login
  const [isManualAuth, setIsManualAuth] = useState(false);

  // Fetch user profile from database
  const fetchUserProfile = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, has_completed_questionnaire, match_id, is_admin')
      .eq('id', userId)
      .single();

    return profile;
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser(mapSupabaseUserToUser(session.user, profile || undefined));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      // Skip if manual auth is in progress
      if (isManualAuth) return;

      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(mapSupabaseUserToUser(session.user, profile || undefined));
        setEmailVerificationPending(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'USER_UPDATED' && session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(mapSupabaseUserToUser(session.user, profile || undefined));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, isManualAuth]);

  // ==============================================
  // Auth Actions
  // ==============================================

  const login = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      setIsManualAuth(true);
      setIsLoading(true);

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return { error: error.message };
        }

        if (data.user) {
          const profile = await fetchUserProfile(data.user.id);
          setUser(mapSupabaseUserToUser(data.user, profile || undefined));
        }

        return {};
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'An error occurred';
        return { error: message };
      } finally {
        setIsLoading(false);
        setIsManualAuth(false);
      }
    },
    [fetchUserProfile]
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      marketingConsent: boolean
    ): Promise<{ error?: string }> => {
      setIsManualAuth(true);
      setIsLoading(true);

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              marketing_consent: marketingConsent,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          return { error: error.message };
        }

        // Check if email confirmation is required
        if (data.user && !data.user.email_confirmed_at) {
          setEmailVerificationPending(true);
        }

        return {};
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'An error occurred';
        return { error: message };
      } finally {
        setIsLoading(false);
        setIsManualAuth(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestPasswordReset = useCallback(
    async (email: string): Promise<{ error?: string }> => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          return { error: error.message };
        }

        return {};
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'An error occurred';
        return { error: message };
      }
    },
    []
  );

  const updatePassword = useCallback(
    async (newPassword: string): Promise<{ error?: string }> => {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          return { error: error.message };
        }

        return {};
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'An error occurred';
        return { error: message };
      }
    },
    []
  );

  const refreshUser = useCallback(async () => {
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (supabaseUser) {
      const profile = await fetchUserProfile(supabaseUser.id);
      setUser(mapSupabaseUserToUser(supabaseUser, profile || undefined));
    }
  }, [fetchUserProfile]);

  // ==============================================
  // Context Value
  // ==============================================

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    emailVerificationPending,
    login,
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
