// stores/useAuthStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthState, User } from '@/types';

export const useAuthStore = create<AuthState>()(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: true,
        setUser: (userData: User) =>
          set({
            user: userData,
            isAuthenticated: true,
          }),
        logout: () =>
          set({
            user: null,
            isAuthenticated: false,
          }),
      }),
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => localStorage), // 👈 proper storage adapter
      }
    )
);