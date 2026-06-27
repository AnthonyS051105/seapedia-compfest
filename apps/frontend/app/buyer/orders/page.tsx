'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { api } from '@/lib/api'
import { Badge, ORDER_STATUS_BADGE_VARIANT } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { Reveal, RevealItem } from '@/components/ui/Reveal'
import { cn } from '@/lib/utils'
import { BuyerOrder, OrderStatus, PaginatedResponse } from '@/types'

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

const DELIVERY_METHOD_LABELS: Record<string, string> = {
  INSTANT: 'Instant',
  NEXT_DAY: 'Next Day',
  REGULAR: 'Regular',
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

export default function BuyerOrdersPage() {
  return (
    <Suspense>
      <BuyerOrdersPageContent />
    </Suspense>
  )
}

function BuyerOrdersPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get('page') ?? '1')
  const tab = (searchParams.get('status') as TabValue) || 'ALL'
  const requestKey = `${page}|${tab}`

  const [result, setResult] = useState<{
    key: string
    orders: BuyerOrder[]
    meta: { total: number; totalPages: number }
  } | null>(null)

  useEffect(() => {
    let isCurrent = true

    api
      .get<PaginatedResponse<BuyerOrder>>('/buyer/orders', {
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
    router.push(`/buyer/orders?${params.toString()}`)
  }

  return (
    <div>
      <Reveal>
        <h1 className="mb-6 font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">Pesanan Saya</h1>
      </Reveal>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => updateParams({ status: t.value === 'ALL' ? undefined : t.value, page: undefined })}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              tab === t.value
                ? 'bg-brand-500 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
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
        <EmptyState
          icon={Package}
          title="Belum ada pesanan"
          description="Buat pesanan pertamamu!"
          action={
            <Link href="/products">
              <Button size="sm">Belanja Sekarang</Button>
            </Link>
          }
        />
      ) : (
        <>
          <Reveal stagger staggerGap={0.06}>
            {orders.map((order) => (
              <RevealItem key={order.id}>
                <Link
                  href={`/buyer/orders/${order.id}`}
                  className="mb-3 block rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-xs text-zinc-400">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status]}>{STATUS_LABELS[order.status]}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-zinc-700 dark:text-zinc-300">
                    Pengiriman {DELIVERY_METHOD_LABELS[order.delivery_method] ?? order.delivery_method}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {formatRupiah(order.final_total)}
                    </p>
                    <p className="text-xs text-zinc-500">{formatTimestamp(order.created_at)}</p>
                  </div>
                </Link>
              </RevealItem>
            ))}
          </Reveal>

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
