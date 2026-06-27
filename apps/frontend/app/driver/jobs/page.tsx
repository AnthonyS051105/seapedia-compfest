'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { MapPin, Truck } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { Reveal, RevealItem } from '@/components/ui/Reveal'
import { Magnetic } from '@/components/ui/Magnetic'
import { ApiErrorResponse, ApiResponse, AvailableJob, DeliveryMethod, JobDetail, PaginatedResponse } from '@/types'

const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  INSTANT: 'Instant',
  NEXT_DAY: 'Next Day',
  REGULAR: 'Regular',
}

const METHOD_BADGE_CLASSES: Record<DeliveryMethod, string> = {
  INSTANT: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  NEXT_DAY: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  REGULAR: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

export default function DriverJobsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const page = Number(searchParams.get('page') ?? '1')
  const requestKey = `${page}`

  const [result, setResult] = useState<{
    key: string
    jobs: AvailableJob[]
    meta: { total: number; totalPages: number }
  } | null>(null)

  const [selectedJob, setSelectedJob] = useState<AvailableJob | null>(null)
  const [isTaking, setIsTaking] = useState(false)

  const fetchJobs = () => {
    api
      .get<PaginatedResponse<AvailableJob>>('/driver/jobs', { params: { page, limit: 10 } })
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
  }

  useEffect(() => {
    fetchJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const isLoading = result?.key !== requestKey
  const jobs = isLoading ? null : result.jobs
  const meta = isLoading ? null : result.meta

  const handleTakeJob = async () => {
    if (!selectedJob) return
    setIsTaking(true)
    try {
      await api.post<ApiResponse<JobDetail>>(`/driver/jobs/${selectedJob.id}/take`)
      toast.success('Pekerjaan berhasil diambil')
      setSelectedJob(null)
      router.push('/driver/jobs/active')
    } catch (error) {
      const apiErr = error as { response?: { data?: ApiErrorResponse } }
      toast.error(apiErr.response?.data?.message ?? 'Gagal mengambil pekerjaan')
      setSelectedJob(null)
      fetchJobs()
    } finally {
      setIsTaking(false)
    }
  }

  const updatePage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(nextPage))
    router.push(`/driver/jobs?${params.toString()}`)
  }

  return (
    <div>
      <Reveal>
        <h1 className="mb-6 font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">Pekerjaan Tersedia</h1>
      </Reveal>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={120} />
          ))}
        </div>
      ) : !jobs || jobs.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Belum ada pekerjaan tersedia"
          description="Coba lagi nanti, pekerjaan baru akan muncul di sini."
        />
      ) : (
        <>
          <Reveal stagger staggerGap={0.06}>
            {jobs.map((job) => (
              <RevealItem key={job.id} className="mb-3">
                <div className="rounded-xl border border-zinc-200 bg-white p-5 card-interactive dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${METHOD_BADGE_CLASSES[job.delivery_method]}`}
                        >
                          {DELIVERY_METHOD_LABELS[job.delivery_method]}
                        </span>
                        <span className="font-mono text-xs text-zinc-400">
                          #{job.order_id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-2 flex items-center gap-1.5 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                        <MapPin className="h-4 w-4 text-zinc-400" />
                        {job.destination_city}
                      </p>
                      <p className="mt-1 font-display text-xl font-bold text-brand-600 dark:text-brand-400">
                        {formatRupiah(job.estimated_earning)}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => setSelectedJob(job)}>
                      Ambil Pekerjaan
                    </Button>
                  </div>
                </div>
              </RevealItem>
            ))}
          </Reveal>

          {meta && meta.totalPages > 1 && (
            <Pagination page={page} totalPages={meta.totalPages} onPageChange={updatePage} className="mt-6" />
          )}
        </>
      )}

      <Modal isOpen={!!selectedJob} onClose={() => setSelectedJob(null)} title="Ambil Pekerjaan?">
        {selectedJob && (
          <div className="flex flex-col gap-2 text-sm">
            <p className="text-zinc-500">
              Order:{' '}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                #{selectedJob.order_id.slice(0, 8).toUpperCase()}
              </span>
            </p>
            <p className="text-zinc-500">
              Tujuan:{' '}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{selectedJob.destination_city}</span>
            </p>
            <p className="text-zinc-500">
              Metode:{' '}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {DELIVERY_METHOD_LABELS[selectedJob.delivery_method]}
              </span>
            </p>
            <p className="text-zinc-500">
              Pendapatan:{' '}
              <span className="font-medium text-brand-600 dark:text-brand-400">
                {formatRupiah(selectedJob.estimated_earning)}
              </span>
            </p>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setSelectedJob(null)} disabled={isTaking}>
            Batal
          </Button>
          <Magnetic>
            <Button onClick={handleTakeJob} isLoading={isTaking}>
              Ya, Ambil
            </Button>
          </Magnetic>
        </div>
      </Modal>
    </div>
  )
}
