'use client'

import { useAuthStore } from '@/store/auth.store'

export default function BuyerDashboardPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Selamat datang, {user?.username}! 👋</h1>
        <p className="text-text-sub">Dashboard Pembeli</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-sm text-text-sub">💰 Saldo</p>
          <p className="mt-1 text-2xl font-bold text-text">
            Rp {(user?.wallet_balance ?? 0).toLocaleString('id-ID')}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-sm text-text-sub">📦 Pesanan Aktif</p>
          <p className="mt-1 text-2xl font-bold text-text">—</p>
        </div>
      </div>
    </div>
  )
}
