'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge, ORDER_STATUS_BADGE_VARIANT } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { OrderStatusTimeline } from '@/components/OrderStatusTimeline'
import { ApiErrorResponse, ApiResponse, OrderStatus, SellerOrderDetail } from '@/types'

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
        <p className="text-text-sub">Pesanan tidak ditemukan.</p>
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
          <h1 className="text-2xl font-bold text-text">#{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-sm text-text-sub">{order.buyer_name}</p>
        </div>
        <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status]}>{STATUS_LABELS[order.status]}</Badge>
      </div>

      <div className="grid gap-6 sm:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="mb-4 font-semibold text-text">Status Pesanan</h2>
            <OrderStatusTimeline history={order.status_history} currentStatus={order.status} />
          </Card>

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
          {order.status === 'SEDANG_DIKEMAS' && (
            <Button onClick={() => setIsProcessModalOpen(true)}>Proses Pesanan</Button>
          )}

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

      <Modal isOpen={isProcessModalOpen} onClose={() => setIsProcessModalOpen(false)} title="Proses Pesanan?">
        <p className="text-sm text-text-sub">
          Pesanan akan ditandai sebagai siap diambil kurir. Status akan berubah menjadi{' '}
          <span className="font-medium text-text">Menunggu Pengirim</span>.
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
