'use client'

import { useEffect, useState } from 'react'
import { Wallet } from 'lucide-react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ApiResponse, DeliveryMethod, DriverEarnings } from '@/types'

const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  INSTANT: 'Instant',
  NEXT_DAY: 'Next Day',
  REGULAR: 'Regular',
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function DriverEarningsPage() {
  const [earnings, setEarnings] = useState<DriverEarnings | null | undefined>(undefined)

  useEffect(() => {
    api
      .get<ApiResponse<DriverEarnings>>('/driver/earnings')
      .then((res) => setEarnings(res.data.data))
      .catch(() => setEarnings(null))
  }, [])

  if (earnings === undefined) {
    return <Skeleton height={300} />
  }

  if (!earnings) {
    return <p className="text-text-sub">Gagal memuat data pendapatan.</p>
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text">Pendapatan Saya</h1>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-text-sub">💰 Total Pendapatan</p>
          <p className="mt-1 text-2xl font-bold text-text">{formatRupiah(earnings.total_earnings)}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-sub">📦 Pengiriman Selesai</p>
          <p className="mt-1 text-2xl font-bold text-text">{earnings.completed_jobs_count}</p>
        </Card>
      </div>

      {earnings.jobs.length === 0 ? (
        <EmptyState icon={Wallet} title="Belum ada pendapatan" description="Selesaikan pekerjaan pengiriman untuk mulai mendapatkan penghasilan." />
      ) : (
        <Card>
          <h2 className="mb-4 font-semibold text-text">Riwayat Pendapatan</h2>
          <div className="flex flex-col divide-y divide-border">
            {earnings.jobs.map((job) => (
              <div key={job.job_id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-text">#{job.order_id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-text-sub">
                    {DELIVERY_METHOD_LABELS[job.delivery_method]}
                    {job.completed_at ? ` · ${formatTimestamp(job.completed_at)}` : ''}
                  </p>
                </div>
                <p className="font-semibold text-secondary">+{formatRupiah(job.earning)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
