import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

/**
 * Zustand authentication store with persistence.
 * - token: JWT token for authenticated requests
 * - user: user profile data
 * Provides actions to set authentication and to logout.
 * Data is persisted in localStorage under key 'auth-storage'.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage', // key for localStorage persistence
    }
  )
);
