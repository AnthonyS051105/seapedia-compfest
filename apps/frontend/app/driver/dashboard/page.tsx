'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MapPin, Truck } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Reveal, RevealItem } from '@/components/ui/Reveal'
import { TiltCard } from '@/components/ui/TiltCard'
import { Magnetic } from '@/components/ui/Magnetic'
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
      <Reveal>
        <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">Dashboard Kurir</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Selamat datang, {user?.username}!</p>
      </Reveal>

      <Reveal stagger staggerGap={0.06} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <RevealItem>
          <Card>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">🚗 Pekerjaan Aktif</p>
            <p className="mt-1 text-2xl font-bold text-zinc-950 dark:text-zinc-50">{activeJob ? 1 : activeJob === null ? 0 : '—'}</p>
          </Card>
        </RevealItem>
        <RevealItem>
          <Card>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">📦 Pekerjaan Tersedia</p>
            <p className="mt-1 text-2xl font-bold text-zinc-950 dark:text-zinc-50">{availableCount ?? '—'}</p>
          </Card>
        </RevealItem>
        <RevealItem>
          <TiltCard>
            <Card>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">💰 Total Pendapatan</p>
              <p className="mt-1 text-2xl font-bold text-zinc-950 dark:text-zinc-50">
                {earnings ? formatRupiah(earnings.total_earnings) : 'Rp 0'}
              </p>
            </Card>
          </TiltCard>
        </RevealItem>
      </Reveal>

      {activeJob && (
        <Reveal>
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                    Pekerjaan Aktif #{activeJob.order_id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <p className="mt-2 flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <MapPin className="h-4 w-4" />
                  {activeJob.address.city}
                </p>
              </div>
              <Magnetic>
                <Link href="/driver/jobs/active">
                  <Button>Lihat Detail</Button>
                </Link>
              </Magnetic>
            </div>
          </Card>
        </Reveal>
      )}

      {!activeJob && availableCount !== null && availableCount > 0 && (
        <Reveal>
          <Card>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Ada <span className="font-semibold text-zinc-950 dark:text-zinc-50">{availableCount}</span> pekerjaan tersedia untuk diambil.
              </p>
              <Magnetic>
                <Link href="/driver/jobs">
                  <Button>Lihat Pekerjaan</Button>
                </Link>
              </Magnetic>
            </div>
          </Card>
        </Reveal>
      )}
    </div>
  )
}
