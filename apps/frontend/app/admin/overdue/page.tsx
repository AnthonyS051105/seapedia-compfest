'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, ORDER_STATUS_BADGE_VARIANT } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { AdminOrderListItem, ApiResponse, PaginatedResponse, ProcessOverdueResult } from '@/types'

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminOverduePage() {
  return (
    <Suspense>
      <AdminOverduePageContent />
    </Suspense>
  )
}

function AdminOverduePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const [result, setResult] = useState<{
    key: number
    orders: AdminOrderListItem[]
    meta: { totalPages: number }
  } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchOverdueOrders = () => {
    api
      .get<PaginatedResponse<AdminOrderListItem>>('/admin/overdue-orders', { params: { page, limit: 10 } })
      .then((res) => {
        setResult({ key: page, orders: res.data.data, meta: { totalPages: res.data.meta.totalPages } })
      })
      .catch(() => {
        setResult({ key: page, orders: [], meta: { totalPages: 0 } })
      })
  }

  useEffect(() => {
    fetchOverdueOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const isLoading = result?.key !== page
  const orders = isLoading ? null : result.orders
  const meta = isLoading ? null : result.meta

  const handleProcessOverdue = async () => {
    setIsProcessing(true)
    try {
      const { data } = await api.post<ApiResponse<ProcessOverdueResult>>('/admin/process-overdue')
      toast.success(`${data.data.processed_count} pesanan overdue berhasil diproses`)
      fetchOverdueOrders()
    } catch {
      toast.error('Gagal memproses pesanan overdue')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Pesanan Overdue</h1>
          <p className="text-text-sub">Pesanan yang melewati SLA pengiriman dan dikembalikan otomatis</p>
        </div>
        <Button onClick={handleProcessOverdue} isLoading={isProcessing} variant="danger">
          <RotateCcw className="h-4 w-4" />
          Proses Semua Overdue
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={56} />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title="Tidak ada pesanan overdue"
          description="Belum ada pesanan yang dikembalikan karena melewati SLA."
        />
      ) : (
        <>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-sub">
                  <th className="px-4 py-3 font-medium">Order ID</th>
                  <th className="px-4 py-3 font-medium">Metode</th>
                  <th className="px-4 py-3 font-medium">Total Refund</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Dibuat</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-text">{order.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-text-sub">{order.delivery_method}</td>
                    <td className="px-4 py-3 text-text">{formatRupiah(order.final_total)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status]}>
                        {order.status.replaceAll('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text-sub">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {meta && meta.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              onPageChange={(nextPage) => router.push(`/admin/overdue?page=${nextPage}`)}
              className="mt-6"
            />
          )}
        </>
      )}
    </div>
  )
}
