import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

export interface UserProfile extends Profile {
  equipment_items?: Array<{ id: string; item_name: string }>;
}

interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  organization: string;
  department: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  checkAuth: async () => {},
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const buildFallbackProfile = (authUser: User, equipmentItems?: Array<{ id: string; item_name: string }>): UserProfile => ({
    id: authUser.id,
    full_name: typeof authUser.user_metadata?.full_name === 'string' ? authUser.user_metadata.full_name : null,
    organization: typeof authUser.user_metadata?.organization === 'string' ? authUser.user_metadata.organization : null,
    department: typeof authUser.user_metadata?.department === 'string' ? authUser.user_metadata.department : null,
    role: typeof authUser.user_metadata?.role === 'string' ? authUser.user_metadata.role : null,
    created_at: new Date().toISOString(),
    equipment_items: equipmentItems || [],
  });

  const hydrateProfile = async (authUser: User) => {
    const p = await fetchProfile(authUser);
    setProfile(p);
  };

  const fetchProfile = async (authUser: User): Promise<UserProfile | null> => {
    try {
      const userId = authUser.id;

      // Run profile and equipment queries in parallel to reduce auth latency.
      const [profileResult, equipmentResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('user_equipment')
          .select('id, item_name')
          .eq('user_id', userId),
      ]);

      if (profileResult.error && profileResult.status !== 406) {
        console.error('fetchProfile error:', profileResult.error);
      }

      const equipmentItems = equipmentResult.data || [];

      if (!profileResult.data) {
        // If the profile row is missing (common right after signup), create/upsert it.
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: userId,
              full_name:
                typeof authUser.user_metadata?.full_name === 'string'
                  ? authUser.user_metadata.full_name
                  : null,
            },
            { onConflict: 'id' },
          );

        if (upsertError) {
          console.error('profile upsert fallback error:', upsertError);
          return buildFallbackProfile(authUser, equipmentItems);
        }

        const { data: retriedProfile, error: retriedError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (retriedError) {
          console.error('fetchProfile retry error:', retriedError);
          return buildFallbackProfile(authUser, equipmentItems);
        }

        if (!retriedProfile) {
          return buildFallbackProfile(authUser, equipmentItems);
        }

        return {
          ...retriedProfile,
          equipment_items: equipmentItems,
        } as UserProfile;
      }

      return {
        ...profileResult.data,
        equipment_items: equipmentItems,
      } as UserProfile;
    } catch (err) {
      console.error('fetchProfile error:', err);
      return buildFallbackProfile(authUser);
    }
  };

  const checkAuth = async () => {
    try {
      // Do not allow auth bootstrap to block indefinitely on slow networks.
      const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Auth session check timed out')), 6000);
        }),
      ]);

      const session = sessionResult.data.session;
      
      if (session?.user) {
        setUser(session.user);
        void hydrateProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.error('checkAuth error:', err);
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    await hydrateProfile(user);
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      setUser(data.user);
      void hydrateProfile(data.user);
    }
  };

  const register = async ({
    email,
    password,
    fullName,
    organization,
    department,
    role,
  }: RegisterPayload) => {
    // Step 1: Sign up with Supabase Auth
    // Pass fullName in metadata so the trigger can access it
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) throw signUpError;

    if (!signUpData.user) {
      throw new Error('User creation failed - no user returned');
    }

    // Step 2: The database trigger has already created a base profile row
    // Now UPDATE it with the additional fields
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: signUpData.user.id,
          full_name: fullName,
          organization,
          department,
          role,
        },
        { onConflict: 'id' },
      );

    if (updateError) {
      console.error('Profile update error:', updateError);
      throw new Error('Failed to update profile: ' + updateError.message);
    }

    // Step 3: Set user immediately when a session exists.
    // Profile hydration is handled by the auth state listener.
    if (signUpData.session?.user) {
      setUser(signUpData.session.user);
      void hydrateProfile(signUpData.session.user);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    setUser(null);
    setProfile(null);
  };

  useEffect(() => {
    const loadingGuard = setTimeout(() => {
      setIsLoading(false);
    }, 8000);

    // Initial auth check
    void checkAuth().finally(() => clearTimeout(loadingGuard));

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.user) {
          setUser(session.user);
          void hydrateProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      clearTimeout(loadingGuard);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, isLoading, checkAuth, login, register, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);