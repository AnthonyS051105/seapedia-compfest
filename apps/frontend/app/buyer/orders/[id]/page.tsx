'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Truck } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge, ORDER_STATUS_BADGE_VARIANT } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { OrderStatusTimeline } from '@/components/OrderStatusTimeline'
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

export default function BuyerOrderDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [order, setOrder] = useState<BuyerOrderDetail | null | undefined>(undefined)

  useEffect(() => {
    api
      .get<ApiResponse<BuyerOrderDetail>>(`/buyer/orders/${params.id}`)
      .then((res) => setOrder(res.data.data))
      .catch(() => setOrder(null))
  }, [params.id])

  if (order === undefined) {
    return (
      <div className="mx-auto max-w-3xl">
        <Skeleton height={400} />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-text-sub">Pesanan tidak ditemukan.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/buyer/orders')}>
          Kembali ke Daftar Pesanan
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">#{order.id.slice(0, 8).toUpperCase()}</h1>
        <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status]}>{STATUS_LABELS[order.status]}</Badge>
      </div>

      <div className="grid gap-6 sm:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="mb-4 font-semibold text-text">Status Pesanan</h2>
            <OrderStatusTimeline history={order.status_history} currentStatus={order.status} />
          </Card>

          {order.status === 'SEDANG_DIKIRIM' && order.driver_info && (
            <Card>
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-text">
                <Truck className="h-4 w-4" />
                Informasi Kurir
              </h2>
              <div className="flex flex-col gap-1 text-sm">
                <p className="text-text-sub">
                  Nama: <span className="font-medium text-text">{order.driver_info.name}</span>
                </p>
                {order.driver_info.phone && (
                  <p className="text-text-sub">
                    Telepon: <span className="font-medium text-text">{order.driver_info.phone}</span>
                  </p>
                )}
              </div>
            </Card>
          )}

          <Card>
            <h2 className="mb-4 font-semibold text-text">Produk</h2>
            <div className="flex flex-col gap-3">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-text">{item.product_name}</p>
                    <p className="text-text-sub">
                      {formatRupiah(item.product_price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium text-text">{formatRupiah(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="mb-4 font-semibold text-text">Rincian Biaya</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-sub">Subtotal</dt>
                <dd className="text-text">{formatRupiah(order.subtotal)}</dd>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-text-sub">Diskon {order.discount_code ? `(${order.discount_code})` : ''}</dt>
                  <dd className="text-danger">-{formatRupiah(order.discount_amount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-text-sub">
                  Ongkos Kirim ({DELIVERY_METHOD_LABELS[order.delivery_method] ?? order.delivery_method})
                </dt>
                <dd className="text-text">{formatRupiah(order.delivery_fee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-sub">PPN 12%</dt>
                <dd className="text-text">{formatRupiah(order.ppn_amount)}</dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
                <dt className="text-text">Total</dt>
                <dd className="text-text">{formatRupiah(order.final_total)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  )
}
