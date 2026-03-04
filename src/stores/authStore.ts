import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService } from '@/lib/api-service';
import type { User, AuthState } from '@/types';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  googleLogin: (accessToken: string) => Promise<{ success: boolean; error?: string; isPending?: boolean }>;
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

      // Initialize session from stored token on app load
      initSession: async () => {
        set({ isLoading: true });
        try {
          const { token, user } = get();

          if (token && user) {
            // Validate token by making a request
            set({
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
          const data = await apiService.login(email, password);

          const user: User = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
          };

          set({
            user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: (error as Error).message };
        }
      },

      googleLogin: async (accessToken: string) => {
        set({ isLoading: true });
        try {
          const data = await apiService.googleLogin(accessToken);

          const user: User = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
          };

          set({
            user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          const errorMessage = (error as Error).message;
          if (errorMessage.includes('lista de espera') || errorMessage.includes('PENDING_APPROVAL')) {
            return { success: false, isPending: true, error: errorMessage };
          }
          return { success: false, error: errorMessage };
        }
      },

      register: async (email, password, name) => {
        set({ isLoading: true });
        try {
          const data = await apiService.register(email, password, name);

          const user: User = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
          };

          set({
            user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: (error as Error).message };
        }
      },

      logout: async () => {
        try {
          await apiService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        }
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
        // For now, just update local state
        // In the future, this should call an API endpoint
        const { user } = get();
        if (!user) return false;

        try {
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
