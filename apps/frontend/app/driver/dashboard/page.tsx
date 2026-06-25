'use client'

import { useAuthStore } from '@/store/auth.store'

export default function DriverDashboardPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Dashboard Kurir</h1>
        <p className="text-text-sub">Selamat datang, {user?.username}!</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-sm text-text-sub">🚗 Pekerjaan Aktif</p>
          <p className="mt-1 text-2xl font-bold text-text">—</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-sm text-text-sub">💰 Pendapatan</p>
          <p className="mt-1 text-2xl font-bold text-text">
            Rp {(user?.driver_earnings ?? 0).toLocaleString('id-ID')}
          </p>
        </div>
      </div>
    </div>
  )
}
