'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Store, Truck, ShieldCheck, LucideIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'
import { ApiResponse, Role } from '@/types'

interface SelectRoleResponseData {
  access_token: string
  expires_in: number
  active_role: Role
}

const ROLE_META: Record<Role, { label: string; description: string; icon: LucideIcon }> = {
  BUYER: { label: 'Pembeli', description: 'Belanja, kelola pesanan', icon: ShoppingCart },
  SELLER: { label: 'Penjual', description: 'Kelola toko dan produk', icon: Store },
  DRIVER: { label: 'Kurir', description: 'Antar paket dan raih penghasilan', icon: Truck },
  ADMIN: { label: 'Admin', description: 'Kelola marketplace', icon: ShieldCheck },
}

export default function SelectRolePage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const setAccessToken = useAuthStore((state) => state.setAccessToken)
  const setActiveRole = useAuthStore((state) => state.setActiveRole)
  const [pendingRole, setPendingRole] = useState<Role | null>(null)

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login')
    }
  }, [user, router])

  if (!user) {
    return null
  }

  const handleSelectRole = async (role: Role) => {
    setPendingRole(role)
    try {
      const { data } = await api.post<ApiResponse<SelectRoleResponseData>>('/auth/select-role', { role })
      const { access_token, active_role } = data.data

      setAccessToken(access_token)
      setActiveRole(active_role)
      router.push(`/${active_role.toLowerCase()}/dashboard`)
    } catch {
      toast.error('Gagal memilih peran. Silakan coba lagi.')
      setPendingRole(null)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text">Halo, {user.username}! 👋</h1>
        <p className="mt-1 text-text-sub">Pilih peran yang ingin kamu gunakan:</p>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {user.roles.map((role) => {
          const meta = ROLE_META[role]
          const Icon = meta.icon
          const isPending = pendingRole === role

          return (
            <button
              key={role}
              type="button"
              disabled={pendingRole !== null}
              onClick={() => handleSelectRole(role)}
              className={cn(
                'flex w-48 flex-col items-center gap-3 rounded-xl border border-border bg-surface p-6 text-center shadow-sm transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-60',
                isPending && 'border-primary'
              )}
            >
              <Icon className="h-8 w-8 text-primary" />
              <span className="font-semibold text-text">{meta.label}</span>
              <span className="text-sm text-text-sub">{meta.description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
