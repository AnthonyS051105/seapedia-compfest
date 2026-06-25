'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MapPin, Truck } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ApiResponse, DriverEarnings, JobDetail, PaginatedResponse } from '@/types'

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

export default function DriverDashboardPage() {
  const user = useAuthStore((state) => state.user)

  const [activeJob, setActiveJob] = useState<JobDetail | null | undefined>(undefined)
  const [earnings, setEarnings] = useState<DriverEarnings | null | undefined>(undefined)
  const [availableCount, setAvailableCount] = useState<number | null>(null)

  useEffect(() => {
    api
      .get<ApiResponse<JobDetail | null>>('/driver/jobs/active')
      .then((res) => setActiveJob(res.data.data))
      .catch(() => setActiveJob(null))

    api
      .get<ApiResponse<DriverEarnings>>('/driver/earnings')
      .then((res) => setEarnings(res.data.data))
      .catch(() => setEarnings(null))

    api
      .get<PaginatedResponse<unknown>>('/driver/jobs', { params: { page: 1, limit: 1 } })
      .then((res) => setAvailableCount(res.data.meta.total))
      .catch(() => setAvailableCount(null))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Dashboard Kurir</h1>
        <p className="text-text-sub">Selamat datang, {user?.username}!</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-text-sub">🚗 Pekerjaan Aktif</p>
          <p className="mt-1 text-2xl font-bold text-text">{activeJob ? 1 : activeJob === null ? 0 : '—'}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-sub">📦 Pekerjaan Tersedia</p>
          <p className="mt-1 text-2xl font-bold text-text">{availableCount ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-sub">💰 Total Pendapatan</p>
          <p className="mt-1 text-2xl font-bold text-text">
            {earnings ? formatRupiah(earnings.total_earnings) : 'Rp 0'}
          </p>
        </Card>
      </div>

      {activeJob && (
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-text-sub" />
                <p className="font-semibold text-text">
                  Pekerjaan Aktif #{activeJob.order_id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <p className="mt-2 flex items-center gap-1 text-sm text-text-sub">
                <MapPin className="h-4 w-4" />
                {activeJob.address.city}
              </p>
            </div>
            <Link href="/driver/jobs/active">
              <Button>Lihat Detail</Button>
            </Link>
          </div>
        </Card>
      )}

      {!activeJob && availableCount !== null && availableCount > 0 && (
        <Card>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-text-sub">
              Ada <span className="font-semibold text-text">{availableCount}</span> pekerjaan tersedia untuk diambil.
            </p>
            <Link href="/driver/jobs">
              <Button>Lihat Pekerjaan</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
