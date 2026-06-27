'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ClipboardList } from 'lucide-react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge, ORDER_STATUS_BADGE_VARIANT } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { AdminOrderListItem, OrderStatus, PaginatedResponse } from '@/types'

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_OPTIONS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Semua Status' },
  { value: 'SEDANG_DIKEMAS', label: 'Sedang Dikemas' },
  { value: 'MENUNGGU_PENGIRIM', label: 'Menunggu Pengirim' },
  { value: 'SEDANG_DIKIRIM', label: 'Sedang Dikirim' },
  { value: 'PESANAN_SELESAI', label: 'Pesanan Selesai' },
  { value: 'DIKEMBALIKAN', label: 'Dikembalikan' },
]

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <AdminOrdersPageContent />
    </Suspense>
  )
}

function AdminOrdersPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')
  const status = (searchParams.get('status') ?? '') as OrderStatus | ''

  const [result, setResult] = useState<{
    key: string
    orders: AdminOrderListItem[]
    meta: { totalPages: number }
  } | null>(null)

  const resultKey = `${page}:${status}`

  useEffect(() => {
    api
      .get<PaginatedResponse<AdminOrderListItem>>('/admin/orders', {
        params: { page, limit: 10, ...(status ? { status } : {}) },
      })
      .then((res) => {
        setResult({ key: resultKey, orders: res.data.data, meta: { totalPages: res.data.meta.totalPages } })
      })
      .catch(() => {
        setResult({ key: resultKey, orders: [], meta: { totalPages: 0 } })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status])

  const isLoading = result?.key !== resultKey
  const orders = isLoading ? null : result.orders
  const meta = isLoading ? null : result.meta

  const handleStatusChange = (nextStatus: string) => {
    const params = new URLSearchParams()
    if (nextStatus) params.set('status', nextStatus)
    router.push(`/admin/orders?${params.toString()}`)
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">Pesanan</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Daftar semua pesanan di marketplace</p>
        </div>

        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none focus:border-brand-500"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={56} />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Tidak ada pesanan" description="Tidak ada pesanan untuk filter ini." />
      ) : (
        <>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-600 dark:text-zinc-400">
                  <th className="px-4 py-3 font-medium">Order ID</th>
                  <th className="px-4 py-3 font-medium">Metode</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Dibuat</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-zinc-200 dark:border-zinc-800 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-950 dark:text-zinc-50">{order.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{order.delivery_method}</td>
                    <td className="px-4 py-3 text-zinc-950 dark:text-zinc-50">{formatRupiah(order.final_total)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status]}>
                        {order.status.replaceAll('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {meta && meta.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              onPageChange={(nextPage) => {
                const params = new URLSearchParams()
                if (status) params.set('status', status)
                params.set('page', String(nextPage))
                router.push(`/admin/orders?${params.toString()}`)
              }}
              className="mt-6"
            />
          )}
        </>
      )}
    </div>
  )
}
