'use client'

import { useAuthStore } from '@/store/auth.store'

export default function SellerDashboardPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Dashboard Penjual</h1>
        <p className="text-text-sub">Selamat datang, {user?.username}!</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-text-sub">Produk Aktif</p>
          <p className="mt-1 text-xl font-bold text-text">—</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-text-sub">Pesanan Baru</p>
          <p className="mt-1 text-xl font-bold text-text">—</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-text-sub">Diproses</p>
          <p className="mt-1 text-xl font-bold text-text">—</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-text-sub">Total Pendapatan</p>
          <p className="mt-1 text-xl font-bold text-text">
            Rp {(user?.seller_income ?? 0).toLocaleString('id-ID')}
          </p>
        </div>
      </div>
    </div>
  )
}
