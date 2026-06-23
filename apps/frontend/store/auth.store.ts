import { create } from 'zustand'
import { Role, User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  activeRole: Role | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string) => void
  setAccessToken: (accessToken: string) => void
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

  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      activeRole: null,
      isAuthenticated: false,
    }),
}))
