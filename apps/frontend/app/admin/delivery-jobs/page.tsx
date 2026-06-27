'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, useReducedMotion, Variants } from 'framer-motion'
import { Truck } from 'lucide-react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge, ORDER_STATUS_BADGE_VARIANT } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { Reveal } from '@/components/ui/Reveal'
import { AdminDeliveryJobListItem, PaginatedResponse } from '@/types'

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

export default function AdminDeliveryJobsPage() {
  return (
    <Suspense>
      <AdminDeliveryJobsPageContent />
    </Suspense>
  )
}

function AdminDeliveryJobsPageContent() {
  const reduceMotion = useReducedMotion()
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const [result, setResult] = useState<{
    key: number
    jobs: AdminDeliveryJobListItem[]
    meta: { totalPages: number }
  } | null>(null)

  useEffect(() => {
    api
      .get<PaginatedResponse<AdminDeliveryJobListItem>>('/admin/delivery-jobs', { params: { page, limit: 10 } })
      .then((res) => {
        setResult({ key: page, jobs: res.data.data, meta: { totalPages: res.data.meta.totalPages } })
      })
      .catch(() => {
        setResult({ key: page, jobs: [], meta: { totalPages: 0 } })
      })
  }, [page])

  const isLoading = result?.key !== page
  const jobs = isLoading ? null : result.jobs
  const meta = isLoading ? null : result.meta

  return (
    <div>
      <Reveal>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">Pengiriman</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Daftar semua delivery job</p>
        </div>
      </Reveal>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={56} />
          ))}
        </div>
      ) : !jobs || jobs.length === 0 ? (
        <EmptyState icon={Truck} title="Belum ada delivery job" description="Belum ada pengiriman yang dibuat." />
      ) : (
        <>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-600 dark:text-zinc-400">
                  <th className="px-4 py-3 font-medium">Order ID</th>
                  <th className="px-4 py-3 font-medium">Driver</th>
                  <th className="px-4 py-3 font-medium">Metode</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Earning</th>
                  <th className="px-4 py-3 font-medium">Dibuat</th>
                </tr>
              </thead>
              <motion.tbody
                initial={reduceMotion ? undefined : 'hidden'}
                whileInView={reduceMotion ? undefined : 'visible'}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ staggerChildren: 0.04 }}
              >
                {jobs.map((job) => (
                  <motion.tr
                    key={job.id}
                    variants={rowVariants}
                    className="border-b border-zinc-200 dark:border-zinc-800 last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-zinc-950 dark:text-zinc-50">{job.order_id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {job.driver_id ? (
                        <span className="font-mono text-xs">{job.driver_id.slice(0, 8)}…</span>
                      ) : (
                        <Badge variant="gray">Belum diambil</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{job.delivery_method}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ORDER_STATUS_BADGE_VARIANT[job.status]}>
                        {job.status.replaceAll('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-950 dark:text-zinc-50">{job.earning !== null ? formatRupiah(job.earning) : '—'}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{formatDate(job.created_at)}</td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </Card>

          {meta && meta.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              onPageChange={(nextPage) => router.push(`/admin/delivery-jobs?page=${nextPage}`)}
              className="mt-6"
            />
          )}
        </>
      )}
    </div>
  )
}
