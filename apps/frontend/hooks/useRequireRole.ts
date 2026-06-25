'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { Role } from '@/types'

export function useRequireRole(role: Role): boolean {
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const activeRole = useAuthStore((state) => state.activeRole)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login')
      return
    }
    if (activeRole !== role) {
      router.replace('/auth/select-role')
    }
  }, [isAuthenticated, activeRole, role, router])

  return isAuthenticated && activeRole === role
}
