'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { CheckCircle2, MapPin, Phone, User } from 'lucide-react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ApiErrorResponse, ApiResponse, DeliveryMethod, JobDetail } from '@/types'

const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  INSTANT: 'Instant',
  NEXT_DAY: 'Next Day',
  REGULAR: 'Regular',
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Pekerjaan Aktif</h1>
        <Badge variant="orange">Sedang dalam Perjalanan</Badge>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <h2 className="mb-4 font-semibold text-text">Order #{job.order_id.slice(0, 8).toUpperCase()}</h2>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-text-sub" />
              <span className="text-text">{job.address.recipient_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-text-sub" />
              <span className="text-text">{job.address.phone}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-text-sub" />
              <span className="text-text">
                {job.address.street}, {job.address.city}, {job.address.province} {job.address.postal_code}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-text">Produk</h2>
          <div className="flex flex-col gap-3">
            {job.order_items.map((item) => (
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

        <Card>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-sub">
              Metode: <span className="font-medium text-text">{DELIVERY_METHOD_LABELS[job.delivery_method]}</span>
            </span>
            <span className="font-semibold text-secondary">Pendapatan: {formatRupiah(job.estimated_earning)}</span>
          </div>
        </Card>

        <Button size="lg" onClick={() => setIsCompleteModalOpen(true)}>
          ✅ Konfirmasi Selesai
        </Button>
      </div>

      <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title="Konfirmasi Pengiriman Selesai?">
        <p className="text-sm text-text-sub">
          Pastikan paket sudah diterima oleh pembeli. Status pesanan akan berubah menjadi{' '}
          <span className="font-medium text-text">Pesanan Selesai</span> dan pendapatan{' '}
          <span className="font-medium text-secondary">{formatRupiah(job.estimated_earning)}</span> akan dicatat.
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
