'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Store as StoreIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/Button'
import { Badge, ORDER_STATUS_BADGE_VARIANT } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Reveal, RevealItem } from '@/components/ui/Reveal'
import { TiltCard } from '@/components/ui/TiltCard'
import { Magnetic } from '@/components/ui/Magnetic'
import { ApiResponse, IncomeReport, PaginatedResponse, SellerOrder, SellerProduct, Store } from '@/types'

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

const STATUS_LABELS: Record<string, string> = {
  SEDANG_DIKEMAS: 'Sedang Dikemas',
  MENUNGGU_PENGIRIM: 'Menunggu Pengirim',
  SEDANG_DIKIRIM: 'Sedang Dikirim',
  PESANAN_SELESAI: 'Pesanan Selesai',
  DIKEMBALIKAN: 'Dikembalikan',
}

export default function SellerDashboardPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  const [store, setStore] = useState<Store | null | undefined>(undefined)
  const [productCount, setProductCount] = useState<number | null>(null)
  const [outOfStockCount, setOutOfStockCount] = useState<number | null>(null)
  const [totalOrders, setTotalOrders] = useState<number | null>(null)
  const [pendingOrders, setPendingOrders] = useState<number | null>(null)
  const [income, setIncome] = useState<IncomeReport | null | undefined>(undefined)
  const [recentOrders, setRecentOrders] = useState<SellerOrder[] | null>(null)

  useEffect(() => {
    api
      .get<ApiResponse<Store | null>>('/seller/store')
      .then((res) => setStore(res.data.data))
      .catch(() => setStore(null))

    api
      .get<PaginatedResponse<SellerProduct>>('/seller/products', { params: { page: 1, limit: 100 } })
      .then((res) => {
        setProductCount(res.data.meta.total)
        setOutOfStockCount(res.data.data.filter((p) => p.stock === 0).length)
      })
      .catch(() => {
        setProductCount(null)
        setOutOfStockCount(null)
      })

    api
      .get<PaginatedResponse<SellerOrder>>('/seller/orders', { params: { page: 1, limit: 100 } })
      .then((res) => {
        setTotalOrders(res.data.meta.total)
        setPendingOrders(res.data.data.filter((o) => o.status === 'SEDANG_DIKEMAS').length)
      })
      .catch(() => {
        setTotalOrders(null)
        setPendingOrders(null)
      })

    api
      .get<ApiResponse<IncomeReport>>('/seller/reports/income')
      .then((res) => setIncome(res.data.data))
      .catch(() => setIncome(null))

    api
      .get<PaginatedResponse<SellerOrder>>('/seller/orders', { params: { page: 1, limit: 5 } })
      .then((res) => setRecentOrders(res.data.data))
      .catch(() => setRecentOrders(null))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">Dashboard Penjual</h1>
          <p className="text-zinc-500">Selamat datang, {user?.username}!</p>
        </div>
      </Reveal>

      {store === undefined ? (
        <Skeleton height={64} className="rounded-xl" />
      ) : store === null ? (
        <Reveal>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2">
              <StoreIcon className="h-5 w-5 text-zinc-400" />
              <p className="text-sm text-zinc-500">Kamu belum memiliki toko. Buat toko untuk mulai berjualan.</p>
            </div>
            <Magnetic>
              <Link href="/seller/store">
                <Button size="sm">Buat Toko</Button>
              </Link>
            </Magnetic>
          </div>
        </Reveal>
      ) : (
        <Reveal>
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <StoreIcon className="h-5 w-5 text-zinc-400" />
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{store.name}</p>
          </div>
        </Reveal>
      )}

      <Reveal stagger staggerGap={0.06} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <RevealItem>
          <TiltCard radiusClassName="rounded-xl">
            <div className="group rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              {income === undefined ? (
                <Skeleton height={32} width="70%" />
              ) : (
                <p className="font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">
                  {formatRupiah(income?.total_income ?? 0)}
                </p>
              )}
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Total Pendapatan</p>
            </div>
          </TiltCard>
        </RevealItem>

        <RevealItem>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            {productCount === null ? (
              <Skeleton height={32} width="50%" />
            ) : (
              <p className="font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">{productCount}</p>
            )}
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Total Produk</p>
          </div>
        </RevealItem>

        <RevealItem>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            {outOfStockCount === null ? (
              <Skeleton height={32} width="50%" />
            ) : (
              <p className="font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">{outOfStockCount}</p>
            )}
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Stok Habis</p>
          </div>
        </RevealItem>

        <RevealItem>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            {pendingOrders === null ? (
              <Skeleton height={32} width="50%" />
            ) : (
              <p className="font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">{pendingOrders}</p>
            )}
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Perlu Diproses · {totalOrders ?? '—'} total
            </p>
          </div>
        </RevealItem>
      </Reveal>

      <Reveal>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-zinc-950 dark:text-zinc-50">Pesanan Terbaru</h2>
            <Link href="/seller/orders" className="text-sm text-brand-600 hover:underline dark:text-brand-400">
              Lihat Semua
            </Link>
          </div>

          {recentOrders === null ? (
            <Skeleton height={200} className="rounded-xl" />
          ) : recentOrders.length === 0 ? (
            <EmptyState title="Belum ada pesanan" description="Pesanan dari pembeli akan muncul di sini." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <table className="w-full text-left">
                <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Pesanan
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Pembeli
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Total</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, index) => (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`/seller/orders/${order.id}`)}
                      className="motion-safe:animate-fade-up cursor-pointer border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">{order.buyer_name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatRupiah(order.final_total)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status]}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Reveal>
    </div>
  )
}
