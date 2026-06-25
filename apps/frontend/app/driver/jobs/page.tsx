'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { PackageSearch, MapPin, Truck } from 'lucide-react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { ApiErrorResponse, ApiResponse, AvailableJob, DeliveryMethod, JobDetail, PaginatedResponse } from '@/types'

const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  INSTANT: 'Instant',
  NEXT_DAY: 'Next Day',
  REGULAR: 'Regular',
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
      <h1 className="mb-6 text-2xl font-bold text-text">Pekerjaan Tersedia</h1>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={120} />
          ))}
        </div>
      ) : !jobs || jobs.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="Belum ada pekerjaan tersedia"
          description="Coba lagi nanti, pekerjaan baru akan muncul di sini."
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {jobs.map((job) => (
              <Card key={job.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-text-sub" />
                      <p className="font-semibold text-text">#{job.order_id.slice(0, 8).toUpperCase()}</p>
                      <Badge variant="blue">{DELIVERY_METHOD_LABELS[job.delivery_method]}</Badge>
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-sm text-text-sub">
                      <MapPin className="h-4 w-4" />
                      {job.destination_city}
                    </p>
                    <p className="mt-1 text-sm font-medium text-secondary">
                      Estimasi pendapatan: {formatRupiah(job.estimated_earning)}
                    </p>
                  </div>
                  <Button onClick={() => setSelectedJob(job)}>Ambil Pekerjaan</Button>
                </div>
              </Card>
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <Pagination page={page} totalPages={meta.totalPages} onPageChange={updatePage} className="mt-6" />
          )}
        </>
      )}

      <Modal isOpen={!!selectedJob} onClose={() => setSelectedJob(null)} title="Ambil Pekerjaan?">
        {selectedJob && (
          <div className="flex flex-col gap-2 text-sm">
            <p className="text-text-sub">
              Order: <span className="font-medium text-text">#{selectedJob.order_id.slice(0, 8).toUpperCase()}</span>
            </p>
            <p className="text-text-sub">
              Tujuan: <span className="font-medium text-text">{selectedJob.destination_city}</span>
            </p>
            <p className="text-text-sub">
              Metode:{' '}
              <span className="font-medium text-text">{DELIVERY_METHOD_LABELS[selectedJob.delivery_method]}</span>
            </p>
            <p className="text-text-sub">
              Pendapatan:{' '}
              <span className="font-medium text-secondary">{formatRupiah(selectedJob.estimated_earning)}</span>
            </p>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setSelectedJob(null)} disabled={isTaking}>
            Batal
          </Button>
          <Button onClick={handleTakeJob} isLoading={isTaking}>
            Ya, Ambil
          </Button>
        </div>
      </Modal>
    </div>
  )
}
