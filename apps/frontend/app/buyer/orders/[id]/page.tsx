'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Truck } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge, ORDER_STATUS_BADGE_VARIANT } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { OrderStatusTimeline } from '@/components/OrderStatusTimeline'
import { Reveal, RevealItem } from '@/components/ui/Reveal'
import { TiltCard } from '@/components/ui/TiltCard'
import { ApiResponse, BuyerOrderDetail, OrderStatus } from '@/types'

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

export default function BuyerOrderDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [order, setOrder] = useState<BuyerOrderDetail | null | undefined>(undefined)

  const fetchOrder = () => {
    api
      .get<ApiResponse<BuyerOrderDetail>>(`/buyer/orders/${params.id}`)
      .then((res) => setOrder(res.data.data))
      .catch(() => setOrder(null))
  }

  useEffect(() => {
    fetchOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') fetchOrder()
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  if (order === undefined) {
    return (
      <div className="mx-auto max-w-4xl">
        <Skeleton height={400} />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-zinc-500">Pesanan tidak ditemukan.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/buyer/orders')}>
          Kembali ke Daftar Pesanan
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Reveal>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">
            #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status]}>{STATUS_LABELS[order.status]}</Badge>
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-3">
        <Reveal delay={0.05} className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 font-display font-semibold text-zinc-950 dark:text-zinc-50">Status Pesanan</h2>
            <OrderStatusTimeline history={order.status_history} currentStatus={order.status} />
          </div>

          {order.status === 'SEDANG_DIKIRIM' && order.driver_info && (
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
              <p className="mb-1 flex items-center gap-2 font-semibold text-brand-700 dark:text-brand-400">
                <Truck className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                Sedang dalam perjalanan
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                Kurir: <span className="font-medium">{order.driver_info.name}</span>
              </p>
              {order.driver_info.taken_at && (
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  Diambil pada {formatTimestamp(order.driver_info.taken_at)}
                </p>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 font-display font-semibold text-zinc-950 dark:text-zinc-50">Produk</h2>
            <Reveal stagger staggerGap={0.05}>
              {order.order_items.map((item) => (
                <RevealItem key={item.id}>
                  <div className="flex items-center justify-between border-b border-zinc-100 py-3 text-sm last:border-0 dark:border-zinc-800">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{item.product_name}</p>
                      <p className="text-zinc-500">
                        {formatRupiah(item.product_price)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{formatRupiah(item.subtotal)}</p>
                  </div>
                </RevealItem>
              ))}
            </Reveal>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
          <TiltCard radiusClassName="rounded-2xl">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 font-display font-semibold text-zinc-950 dark:text-zinc-50">Rincian Biaya</h2>
              <div className="flex flex-col">
                <div className="flex justify-between py-1.5 text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Subtotal</span>
                  <span className="text-zinc-900 dark:text-zinc-100">{formatRupiah(order.subtotal)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between py-1.5 text-sm">
                    <span className="text-success-600 dark:text-success-500">
                      Diskon {order.discount_code ? `(${order.discount_code})` : ''}
                    </span>
                    <span className="text-success-600 dark:text-success-500">
                      -{formatRupiah(order.discount_amount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Ongkos Kirim ({DELIVERY_METHOD_LABELS[order.delivery_method] ?? order.delivery_method})
                  </span>
                  <span className="text-zinc-900 dark:text-zinc-100">{formatRupiah(order.delivery_fee)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">PPN 12%</span>
                  <span className="text-zinc-900 dark:text-zinc-100">{formatRupiah(order.ppn_amount)}</span>
                </div>
              </div>
              <div className="my-3 h-px bg-zinc-100 dark:bg-zinc-800" />
              <div className="flex justify-between font-display text-lg font-bold text-zinc-950 dark:text-zinc-50">
                <span>Total</span>
                <span>{formatRupiah(order.final_total)}</span>
              </div>
            </div>
          </TiltCard>
        </Reveal>
      </div>
    </div>
  )
}
