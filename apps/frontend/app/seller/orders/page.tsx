'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import { api } from '@/lib/api'
import { Badge, ORDER_STATUS_BADGE_VARIANT } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { cn } from '@/lib/utils'
import { OrderStatus, PaginatedResponse, SellerOrder } from '@/types'

type TabValue = 'ALL' | OrderStatus

const TABS: { value: TabValue; label: string }[] = [
  { value: 'ALL', label: 'Semua' },
  { value: 'SEDANG_DIKEMAS', label: 'Sedang Dikemas' },
  { value: 'MENUNGGU_PENGIRIM', label: 'Menunggu Pengirim' },
  { value: 'SEDANG_DIKIRIM', label: 'Sedang Dikirim' },
  { value: 'PESANAN_SELESAI', label: 'Pesanan Selesai' },
  { value: 'DIKEMBALIKAN', label: 'Dikembalikan' },
]

const STATUS_LABELS: Record<OrderStatus, string> = {
  SEDANG_DIKEMAS: 'Sedang Dikemas',
  MENUNGGU_PENGIRIM: 'Menunggu Pengirim',
  SEDANG_DIKIRIM: 'Sedang Dikirim',
  PESANAN_SELESAI: 'Pesanan Selesai',
  DIKEMBALIKAN: 'Dikembalikan',
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function SellerOrdersPage() {
  return (
    <Suspense>
      <SellerOrdersPageContent />
    </Suspense>
  )
}

function SellerOrdersPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get('page') ?? '1')
  const tab = (searchParams.get('status') as TabValue) || 'ALL'
  const requestKey = `${page}|${tab}`

  const [result, setResult] = useState<{
    key: string
    orders: SellerOrder[]
    meta: { total: number; totalPages: number }
  } | null>(null)

  useEffect(() => {
    let isCurrent = true

    api
      .get<PaginatedResponse<SellerOrder>>('/seller/orders', {
        params: { page, limit: 10, status: tab === 'ALL' ? undefined : tab },
      })
      .then((res) => {
        if (!isCurrent) return
        setResult({
          key: requestKey,
          orders: res.data.data,
          meta: { total: res.data.meta.total, totalPages: res.data.meta.totalPages },
        })
      })
      .catch(() => {
        if (!isCurrent) return
        setResult({ key: requestKey, orders: [], meta: { total: 0, totalPages: 0 } })
      })

    return () => {
      isCurrent = false
    }
  }, [page, tab, requestKey])

  const isLoading = result?.key !== requestKey
  const orders = isLoading ? null : result.orders
  const meta = isLoading ? null : result.meta

  const updateParams = (next: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })
    router.push(`/seller/orders?${params.toString()}`)
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-950 dark:text-zinc-50">Pesanan Masuk</h1>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => updateParams({ status: t.value === 'ALL' ? undefined : t.value, page: undefined })}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              tab === t.value ? 'bg-primary text-white' : 'bg-gray-100 text-zinc-600 dark:text-zinc-400 hover:bg-gray-200'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={100} />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Belum ada pesanan" description="Pesanan masuk akan tampil di sini." />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <Link key={order.id} href={`/seller/orders/${order.id}`}>
                <Card variant="hover" className="cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-zinc-950 dark:text-zinc-50">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{order.buyer_name}</p>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{formatTimestamp(order.created_at)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status]}>
                        {STATUS_LABELS[order.status]}
                      </Badge>
                      <p className="font-semibold text-zinc-950 dark:text-zinc-50">{formatRupiah(order.final_total)}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              onPageChange={(nextPage) => updateParams({ page: nextPage })}
              className="mt-6"
            />
          )}
        </>
      )}
    </div>
  )
}
