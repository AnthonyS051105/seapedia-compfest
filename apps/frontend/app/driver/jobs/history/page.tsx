'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { History, MapPin, Truck } from 'lucide-react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { Reveal, RevealItem } from '@/components/ui/Reveal'
import { AvailableJob, DeliveryMethod, PaginatedResponse } from '@/types'

const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  INSTANT: 'Instant',
  NEXT_DAY: 'Next Day',
  REGULAR: 'Regular',
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

export default function DriverJobHistoryPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const page = Number(searchParams.get('page') ?? '1')
  const requestKey = `${page}`

  const [result, setResult] = useState<{
    key: string
    jobs: AvailableJob[]
    meta: { total: number; totalPages: number }
  } | null>(null)

  useEffect(() => {
    api
      .get<PaginatedResponse<AvailableJob>>('/driver/jobs/history', { params: { page, limit: 10 } })
      .then((res) => {
        setResult({
          key: requestKey,
          jobs: res.data.data,
          meta: { total: res.data.meta.total, totalPages: res.data.meta.totalPages },
        })
      })
      .catch(() => {
        setResult({ key: requestKey, jobs: [], meta: { total: 0, totalPages: 0 } })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const isLoading = result?.key !== requestKey
  const jobs = isLoading ? null : result.jobs
  const meta = isLoading ? null : result.meta

  const updatePage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(nextPage))
    router.push(`/driver/jobs/history?${params.toString()}`)
  }

  return (
    <div>
      <Reveal>
        <h1 className="mb-6 text-2xl font-bold text-zinc-950 dark:text-zinc-50">Riwayat Pekerjaan</h1>
      </Reveal>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={100} />
          ))}
        </div>
      ) : !jobs || jobs.length === 0 ? (
        <EmptyState icon={History} title="Belum ada riwayat pekerjaan" description="Pekerjaan yang sudah diselesaikan akan tampil di sini." />
      ) : (
        <>
          <Reveal stagger staggerGap={0.06} className="flex flex-col gap-3">
            {jobs.map((job) => (
              <RevealItem key={job.id}>
                <Card>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                        <p className="font-semibold text-zinc-950 dark:text-zinc-50">#{job.order_id.slice(0, 8).toUpperCase()}</p>
                        <Badge variant="green">{DELIVERY_METHOD_LABELS[job.delivery_method]}</Badge>
                      </div>
                      <p className="mt-2 flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                        <MapPin className="h-4 w-4" />
                        {job.destination_city}
                      </p>
                    </div>
                    <p className="font-semibold text-brand-600 dark:text-brand-400">{formatRupiah(job.estimated_earning)}</p>
                  </div>
                </Card>
              </RevealItem>
            ))}
          </Reveal>

          {meta && meta.totalPages > 1 && (
            <Pagination page={page} totalPages={meta.totalPages} onPageChange={updatePage} className="mt-6" />
          )}
        </>
      )}
    </div>
  )
}
