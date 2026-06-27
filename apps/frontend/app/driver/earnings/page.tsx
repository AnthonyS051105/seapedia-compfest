'use client'

import { useEffect, useState } from 'react'
import { Wallet } from 'lucide-react'
import { api } from '@/lib/api'
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
    return <p className="text-zinc-500">Gagal memuat data pendapatan.</p>
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">Pendapatan Saya</h1>

      <div className="rounded-2xl bg-brand-500 p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">Total Pendapatan</p>
        <p className="mt-1 font-display text-5xl font-extrabold text-white">
          {formatRupiah(earnings.total_earnings)}
        </p>
        <p className="mt-2 text-sm text-brand-100">{earnings.completed_jobs_count} pengiriman selesai</p>
      </div>

      <h2 className="mb-2 mt-8 font-display font-semibold text-zinc-950 dark:text-zinc-50">Riwayat Pendapatan</h2>

      {earnings.jobs.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Belum ada pendapatan"
          description="Selesaikan pekerjaan pengiriman untuk mulai mendapatkan penghasilan."
        />
      ) : (
        <div>
          {earnings.jobs.map((job) => (
            <div
              key={job.job_id}
              className="flex items-center justify-between border-b border-zinc-100 py-3 text-sm last:border-0 dark:border-zinc-800"
            >
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  #{job.order_id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-zinc-500">
                  {DELIVERY_METHOD_LABELS[job.delivery_method]}
                  {job.completed_at ? ` · ${formatTimestamp(job.completed_at)}` : ''}
                </p>
              </div>
              <p className="font-semibold text-success-600 dark:text-success-500">+{formatRupiah(job.earning)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
