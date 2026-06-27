'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Truck, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge, ORDER_STATUS_BADGE_VARIANT } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { OrderStatusTimeline } from '@/components/OrderStatusTimeline'
import { ApiErrorResponse, ApiResponse, OrderStatus, SellerOrderDetail } from '@/types'

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

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

export default function SellerOrderDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [order, setOrder] = useState<SellerOrderDetail | null | undefined>(undefined)
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchOrder = () => {
    api
      .get<ApiResponse<SellerOrderDetail>>(`/seller/orders/${params.id}`)
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

  const handleProcess = async () => {
    setIsProcessing(true)
    try {
      const { data } = await api.post<ApiResponse<SellerOrderDetail>>(`/seller/orders/${params.id}/process`)
      setOrder(data.data)
      setIsProcessModalOpen(false)
      toast.success('Pesanan berhasil diproses. Menunggu kurir.')
    } catch (error) {
      const apiErr = error as { response?: { data?: ApiErrorResponse } }
      toast.error(apiErr.response?.data?.message ?? 'Gagal memproses pesanan')
    } finally {
      setIsProcessing(false)
    }
  }

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
        <p className="text-zinc-500">Pesanan tidak ditemukan.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/seller/orders')}>
          Kembali ke Daftar Pesanan
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">
            #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm text-zinc-500">{order.buyer_name}</p>
        </div>
        <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status]}>{STATUS_LABELS[order.status]}</Badge>
      </div>

      <div className="grid gap-6 sm:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 font-display font-semibold text-zinc-950 dark:text-zinc-50">Status Pesanan</h2>
            <OrderStatusTimeline history={order.status_history} currentStatus={order.status} />
          </div>

          {order.status === 'DIKEMBALIKAN' && (
            <div className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-400">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>Pesanan ini telah dikembalikan karena melewati batas SLA pengiriman.</p>
            </div>
          )}

          {(order.status === 'SEDANG_DIKIRIM' || order.status === 'PESANAN_SELESAI') && order.driver_info && (
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
              <h2 className="mb-2 flex items-center gap-2 font-semibold text-brand-700 dark:text-brand-400">
                <Truck className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                Informasi Pengiriman
              </h2>
              <div className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                <p>
                  Kurir: <span className="font-medium text-zinc-900 dark:text-zinc-100">{order.driver_info.name}</span>
                </p>
                {order.driver_info.taken_at && (
                  <p>
                    Diambil pada:{' '}
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {formatDateTime(order.driver_info.taken_at)}
                    </span>
                  </p>
                )}
                {order.status === 'PESANAN_SELESAI' && order.driver_info.completed_at && (
                  <p>
                    Selesai pada:{' '}
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {formatDateTime(order.driver_info.completed_at)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 font-display font-semibold text-zinc-950 dark:text-zinc-50">Produk</h2>
            <div>
              {order.order_items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-zinc-100 py-3 text-sm last:border-0 dark:border-zinc-800"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{item.product_name}</p>
                    <p className="text-zinc-500">
                      {formatRupiah(item.product_price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{formatRupiah(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {order.status === 'SEDANG_DIKEMAS' && (
            <Button onClick={() => setIsProcessModalOpen(true)}>Proses Pesanan</Button>
          )}

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
        </div>
      </div>

      <Modal isOpen={isProcessModalOpen} onClose={() => setIsProcessModalOpen(false)} title="Proses Pesanan?">
        <p className="text-sm text-zinc-500">
          Pesanan akan ditandai sebagai siap diambil kurir. Status akan berubah menjadi{' '}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Menunggu Pengirim</span>.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsProcessModalOpen(false)} disabled={isProcessing}>
            Batal
          </Button>
          <Button onClick={handleProcess} isLoading={isProcessing}>
            Proses Pesanan
          </Button>
        </div>
      </Modal>
    </div>
  )
}
