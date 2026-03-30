import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApiError, getCurrentUser, loginUser, registerUser } from '../lib/api';
import { User } from '../types';
import { useCartStore } from './cartStore';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message: string; user?: User | null }>;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message: string; user?: User | null }>;
  logout: () => void;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      initialize: async () => {
        const { token, isInitialized, isLoading } = get();
        if (isInitialized || isLoading) {
          return;
        }

        if (!token) {
          set({ isInitialized: true });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await getCurrentUser();
          await useCartStore.getState().fetchCart(user.id);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });
        } catch {
          useCartStore.getState().reset();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { user, token } = await loginUser(email, password);
          await useCartStore.getState().fetchCart(user.id);
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });
          return { success: true, message: 'Login successful!', user };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            message: getErrorMessage(error, 'Unable to login right now.'),
          };
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { user, token } = await registerUser(name, email, password);
          await useCartStore.getState().fetchCart(user.id);
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });
          return { success: true, message: 'Registration successful!', user };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            message: getErrorMessage(error, 'Unable to register right now.'),
          };
        }
      },

      logout: () => {
        useCartStore.getState().reset();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
