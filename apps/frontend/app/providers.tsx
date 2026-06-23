'use client'

import { ReactNode, useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { ApiResponse, User } from '@/types'

interface RefreshResponseData {
  access_token: string
  expires_in: number
  user: User
}

export function Providers({ children }: { children: ReactNode }) {
  const setAuth = useAuthStore((state) => state.setAuth)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function initializeAuth() {
      try {
        const { data } = await api.post<ApiResponse<RefreshResponseData>>('/auth/refresh')
        if (isMounted) {
          setAuth(data.data.user, data.data.access_token)
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
