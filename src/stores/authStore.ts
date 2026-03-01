import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { User, AuthState } from '@/types';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
  initSession: () => Promise<void>;
  updateProfile: (updates: { name?: string; avatar?: string }) => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      // Initialize session from Supabase on app load
      initSession: async () => {
        set({ isLoading: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            // Fetch profile from profiles table
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            const user: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: profile?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
              avatar: profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`,
              friendCode: profile?.friend_code || undefined,
              createdAt: session.user.created_at,
            };

            set({
              user,
              token: session.access_token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Error initializing session:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
          }

          if (data.user && data.session) {
            // Fetch profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            const user: User = {
              id: data.user.id,
              email: data.user.email || '',
              name: profile?.name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || '',
              avatar: profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
              friendCode: profile?.friend_code || undefined,
              createdAt: data.user.created_at,
            };

            set({
              user,
              token: data.session.access_token,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true };
          }

          set({ isLoading: false });
          return { success: false, error: 'No se pudo iniciar sesion' };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: (error as Error).message };
        }
      },

      register: async (email, password, name) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name },
            },
          });

          if (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
          }

          if (data.user) {
            // Generate friend code
            const friendCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            // Create profile in profiles table
            await supabase.from('profiles').upsert({
              id: data.user.id,
              name,
              email,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
              friend_code: friendCode,
            });

            const user: User = {
              id: data.user.id,
              email: data.user.email || email,
              name,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
              friendCode,
              createdAt: data.user.created_at,
            };

            set({
              user,
              token: data.session?.access_token || null,
              isAuthenticated: !!data.session,
              isLoading: false,
            });
            return { success: true };
          }

          set({ isLoading: false });
          return { success: false, error: 'No se pudo crear la cuenta' };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: (error as Error).message };
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      setToken: (token) => {
        set({ token });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },

      updateProfile: async (updates) => {
        const { user } = get();
        if (!user) return false;

        try {
          const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

          if (error) {
            console.error('Error updating profile:', error);
            return false;
          }

          set({ user: { ...user, ...updates } });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'plexparty-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
