import { create } from 'zustand'
import { Role, User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  activeRole: Role | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string) => void
  setAccessToken: (accessToken: string) => void
  setActiveRole: (role: Role) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  activeRole: null,
  isAuthenticated: false,

  setAuth: (user, accessToken) =>
    set({
      user,
      accessToken,
      activeRole: user.active_role,
      isAuthenticated: true,
    }),

  setAccessToken: (accessToken) => set({ accessToken }),

  setActiveRole: (role) =>
    set((state) => ({
      activeRole: role,
      user: state.user ? { ...state.user, active_role: role } : state.user,
    })),

  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      activeRole: null,
      isAuthenticated: false,
    }),
}))
