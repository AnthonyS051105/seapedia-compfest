'use client'

import { ReactNode, useEffect, useState } from 'react'
import axios from 'axios'
import { Toaster } from 'react-hot-toast'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { ApiResponse, User } from '@/types'

interface RefreshResponseData {
  access_token: string
  expires_in: number
}

export function Providers({ children }: { children: ReactNode }) {
  const setAuth = useAuthStore((state) => state.setAuth)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function initializeAuth() {
      try {
        const { data: refreshData } = await axios.post<ApiResponse<RefreshResponseData>>(
          '/api/auth/refresh',
          {},
          { withCredentials: true }
        )
        useAuthStore.getState().setAccessToken(refreshData.data.access_token)
        const { data: meData } = await api.get<ApiResponse<User>>('/auth/me')
        if (isMounted) {
          setAuth(meData.data, refreshData.data.access_token)
        }
      } catch {
        if (isMounted) {
          clearAuth()
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false)
        }
      }
    }

    void initializeAuth()

    return () => {
      isMounted = false
    }
  }, [setAuth, clearAuth])

  if (isInitializing) {
    return null
  }

  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  )
}
