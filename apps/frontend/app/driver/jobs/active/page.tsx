'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { CheckCircle2, MapPin, Phone } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Reveal } from '@/components/ui/Reveal'
import { TiltCard } from '@/components/ui/TiltCard'
import { Magnetic } from '@/components/ui/Magnetic'
import { ApiErrorResponse, ApiResponse, DeliveryMethod, JobDetail } from '@/types'

const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  INSTANT: 'Instant',
  NEXT_DAY: 'Next Day',
  REGULAR: 'Regular',
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default function DriverActiveJobPage() {
  const router = useRouter()

  const [job, setJob] = useState<JobDetail | null | undefined>(undefined)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  useEffect(() => {
    api
      .get<ApiResponse<JobDetail | null>>('/driver/jobs/active')
      .then((res) => setJob(res.data.data))
      .catch(() => setJob(null))
  }, [])

  const handleComplete = async () => {
    if (!job) return
    setIsCompleting(true)
    try {
      const { data } = await api.post<ApiResponse<JobDetail>>(`/driver/jobs/${job.id}/complete`)
      const earning = data.data.earning ?? 0
      toast.success(`Pengiriman selesai! Pendapatan ${formatRupiah(earning)} dicatat`)
      router.push('/driver/earnings')
    } catch (error) {
      const apiErr = error as { response?: { data?: ApiErrorResponse } }
      toast.error(apiErr.response?.data?.message ?? 'Gagal mengonfirmasi pengiriman')
    } finally {
      setIsCompleting(false)
      setIsCompleteModalOpen(false)
    }
  }

  if (job === undefined) {
    return (
      <div className="mx-auto max-w-2xl">
        <Skeleton height={350} />
      </div>
    )
  }

  if (!job) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="Tidak ada pekerjaan aktif"
        description="Ambil pekerjaan dari daftar pekerjaan tersedia untuk mulai mengantar."
        action={<Button onClick={() => router.push('/driver/jobs')}>Lihat Pekerjaan Tersedia</Button>}
      />
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal>
        <TiltCard maxTilt={4} radiusClassName="rounded-2xl">
          <div className="rounded-2xl border-2 border-brand-500 bg-white p-6 dark:bg-zinc-900">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success-500" />
              <span className="text-sm font-semibold text-success-600 dark:text-success-500">Sedang Berlangsung</span>
            </div>

            <p className="mb-4 font-mono text-xs text-zinc-400">Order #{job.order_id.slice(0, 8).toUpperCase()}</p>

            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                {getInitials(job.address.recipient_name)}
              </span>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{job.address.recipient_name}</p>
                <p className="flex items-center gap-1 text-sm text-zinc-500">
                  <Phone className="h-3.5 w-3.5" />
                  {job.address.phone}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              <span>
                {job.address.street}, {job.address.city}, {job.address.province} {job.address.postal_code}
              </span>
            </div>

            <div className="mt-6">
              <h2 className="mb-3 font-display font-semibold text-zinc-950 dark:text-zinc-50">Produk</h2>
              <div>
                {job.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b border-zinc-100 py-2 text-sm last:border-0 dark:border-zinc-800"
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

            <div className="mt-4 flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-950">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Metode: {DELIVERY_METHOD_LABELS[job.delivery_method]}
              </span>
              <span className="font-semibold text-brand-600 dark:text-brand-400">
                {formatRupiah(job.estimated_earning)}
              </span>
            </div>

            <Magnetic className="mt-6 block">
              <Button size="lg" className="w-full" onClick={() => setIsCompleteModalOpen(true)}>
                Konfirmasi Selesai
              </Button>
            </Magnetic>
          </div>
        </TiltCard>
      </Reveal>

      <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title="Konfirmasi Pengiriman Selesai?">
        <p className="text-sm text-zinc-500">
          Pastikan paket sudah diterima oleh pembeli. Status pesanan akan berubah menjadi{' '}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Pesanan Selesai</span> dan pendapatan{' '}
          <span className="font-medium text-brand-600 dark:text-brand-400">{formatRupiah(job.estimated_earning)}</span>{' '}
          akan dicatat.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsCompleteModalOpen(false)} disabled={isCompleting}>
            Batal
          </Button>
          <Button onClick={handleComplete} isLoading={isCompleting}>
            Konfirmasi Selesai
          </Button>
        </div>
      </Modal>
    </div>
  )
}
