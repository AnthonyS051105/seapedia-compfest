'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, useReducedMotion, Variants } from 'framer-motion'
import { AlertCircle, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge, ORDER_STATUS_BADGE_VARIANT } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { Reveal } from '@/components/ui/Reveal'
import { Magnetic } from '@/components/ui/Magnetic'
import { AdminOrderListItem, ApiResponse, PaginatedResponse, ProcessOverdueResult } from '@/types'

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

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
  const reduceMotion = useReducedMotion()
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const [result, setResult] = useState<{
    key: number
    orders: AdminOrderListItem[]
    meta: { total: number; totalPages: number }
  } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchOverdueOrders = () => {
    api
      .get<PaginatedResponse<AdminOrderListItem>>('/admin/overdue-orders', { params: { page, limit: 10 } })
      .then((res) => {
        setResult({
          key: page,
          orders: res.data.data,
          meta: { total: res.data.meta.total, totalPages: res.data.meta.totalPages },
        })
      })
      .catch(() => {
        setResult({ key: page, orders: [], meta: { total: 0, totalPages: 0 } })
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
      <Reveal>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">Pesanan Overdue</h1>
          <p className="text-zinc-500">Pesanan yang melewati SLA pengiriman dan dikembalikan otomatis</p>
        </div>
      </Reveal>

      {meta && meta.total > 0 && (
        <Reveal>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 dark:border-danger-500/30 dark:bg-danger-500/10">
            <div className="flex items-center gap-2 text-sm text-danger-700 dark:text-danger-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>
                <span className="font-semibold">{meta.total} pesanan</span> belum diproses
              </span>
            </div>
            <Magnetic strength={0.3}>
              <Button variant="danger" size="sm" onClick={handleProcessOverdue} isLoading={isProcessing}>
                <RotateCcw className="h-4 w-4" />
                Proses Semua
              </Button>
            </Magnetic>
          </div>
        </Reveal>
      )}

      {isLoading ? (
        <Skeleton height={300} className="rounded-xl" />
      ) : !orders || orders.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title="Tidak ada pesanan overdue"
          description="Belum ada pesanan yang dikembalikan karena melewati SLA."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Order ID
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Metode
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Total Refund
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Dibuat
                  </th>
                </tr>
              </thead>
              <motion.tbody
                initial={reduceMotion ? undefined : 'hidden'}
                whileInView={reduceMotion ? undefined : 'visible'}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ staggerChildren: 0.04 }}
              >
                {orders.map((order) => (
                  <motion.tr
                    key={order.id}
                    variants={rowVariants}
                    className="border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{order.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-zinc-500">{order.delivery_method}</td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      {formatRupiah(order.final_total)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status]}>
                        {order.status.replaceAll('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{formatDate(order.created_at)}</td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>

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
