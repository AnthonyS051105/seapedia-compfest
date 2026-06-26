'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, PackageX, ClipboardList, Wallet, Store as StoreIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, ORDER_STATUS_BADGE_VARIANT } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
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
      <div>
        <h1 className="text-2xl font-bold text-text">Dashboard Penjual</h1>
        <p className="text-text-sub">Selamat datang, {user?.username}!</p>
      </div>

      {store === undefined ? (
        <Skeleton className="h-16 w-full" />
      ) : store === null ? (
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <StoreIcon className="h-5 w-5 text-text-sub" />
              <p className="text-sm text-text-sub">Kamu belum memiliki toko. Buat toko untuk mulai berjualan.</p>
            </div>
            <Link href="/seller/store">
              <Button>Buat Toko</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center gap-2">
            <StoreIcon className="h-5 w-5 text-text-sub" />
            <p className="font-semibold text-text">{store.name}</p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <div className="flex items-center gap-2 text-text-sub">
            <Package className="h-4 w-4" />
            <p className="text-sm">Total Produk</p>
          </div>
          {productCount === null ? (
            <Skeleton className="mt-2 h-7 w-12" />
          ) : (
            <p className="mt-1 text-xl font-bold text-text">{productCount}</p>
          )}
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-text-sub">
            <PackageX className="h-4 w-4" />
            <p className="text-sm">Stok Habis</p>
          </div>
          {outOfStockCount === null ? (
            <Skeleton className="mt-2 h-7 w-12" />
          ) : (
            <p className="mt-1 text-xl font-bold text-text">{outOfStockCount}</p>
          )}
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-text-sub">
            <ClipboardList className="h-4 w-4" />
            <p className="text-sm">Perlu Diproses</p>
          </div>
          {pendingOrders === null ? (
            <Skeleton className="mt-2 h-7 w-12" />
          ) : (
            <p className="mt-1 text-xl font-bold text-text">{pendingOrders}</p>
          )}
          <p className="mt-1 text-xs text-text-sub">{totalOrders ?? '—'} total pesanan</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-text-sub">
            <Wallet className="h-4 w-4" />
            <p className="text-sm">Total Pendapatan</p>
          </div>
          {income === undefined ? (
            <Skeleton className="mt-2 h-7 w-24" />
          ) : (
            <p className="mt-1 text-xl font-bold text-text">{formatRupiah(income?.total_income ?? 0)}</p>
          )}
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Pesanan Terbaru</h2>
          <Link href="/seller/orders" className="text-sm text-primary hover:underline">
            Lihat Semua
          </Link>
        </div>

        {recentOrders === null ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : recentOrders.length === 0 ? (
          <EmptyState title="Belum ada pesanan" description="Pesanan dari pembeli akan muncul di sini." />
        ) : (
          <div className="flex flex-col gap-3">
            {recentOrders.map((order) => (
              <Link key={order.id} href={`/seller/orders/${order.id}`}>
                <Card variant="hover">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-text">
                        #{order.id.slice(0, 8).toUpperCase()} — {order.buyer_name}
                      </p>
                      <p className="text-sm text-text-sub">{formatRupiah(order.final_total)}</p>
                    </div>
                    <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status]}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
