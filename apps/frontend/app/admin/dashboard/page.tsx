'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Users, Store, Package, ClipboardList, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { AdminDashboardStats, ApiResponse, SimulateNextDayResult } from '@/types'

function formatDate(value: Date): string {
  return value.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)

  const fetchStats = () => {
    api
      .get<ApiResponse<AdminDashboardStats>>('/admin/dashboard/stats')
      .then((res) => setStats(res.data.data))
      .catch(() => toast.error('Gagal memuat statistik dashboard'))
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const handleSimulateNextDay = async () => {
    setIsSimulating(true)
    try {
      const { data } = await api.post<ApiResponse<SimulateNextDayResult>>('/admin/simulate-next-day')
      toast.success(
        `Hari berikutnya disimulasikan. ${data.data.processed_count} pesanan overdue diproses.`
      )
      fetchStats()
    } catch {
      toast.error('Gagal menjalankan simulasi hari berikutnya')
    } finally {
      setIsSimulating(false)
    }
  }

  const systemDate = stats
    ? formatDate(new Date(Date.now() + stats.system_date_offset * 24 * 60 * 60 * 1000))
    : null

  const statCards = stats
    ? [
        { label: 'Pengguna', value: stats.users.total, icon: Users },
        { label: 'Toko', value: stats.stores.total, icon: Store },
        { label: 'Produk', value: stats.products.total, icon: Package },
        { label: 'Pesanan', value: stats.orders.total, icon: ClipboardList },
      ]
    : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Admin Dashboard — SEAPEDIA</h1>
          <p className="text-text-sub">Ringkasan marketplace</p>
        </div>

        <div className="flex items-center gap-3">
          {systemDate && (
            <p className="text-sm text-text-sub">
              Tanggal Sistem: <span className="font-medium text-text">{systemDate}</span>{' '}
              <span className="text-text-sub">(+{stats?.system_date_offset} hari)</span>
            </p>
          )}
          <Button onClick={handleSimulateNextDay} isLoading={isSimulating} variant="secondary">
            <RefreshCw className="h-4 w-4" />
            Simulasi Hari Berikutnya
          </Button>
        </div>
      </div>

      {!stats || !statCards ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={88} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-sub">{label}</p>
                <Icon className="h-4 w-4 text-text-sub" />
              </div>
              <p className="mt-1 text-xl font-bold text-text">{value}</p>
            </Card>
          ))}
        </div>
      )}

      {stats && (
        <Card>
          <p className="mb-3 text-sm font-medium text-text-sub">Pesanan per Status</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {Object.entries(stats.orders.by_status).map(([status, count]) => (
              <div key={status} className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-text-sub">{status.replaceAll('_', ' ')}</p>
                <p className="mt-1 text-lg font-bold text-text">{count}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {stats && (
        <Card
          className={
            stats.overdue_orders > 0
              ? 'border-danger bg-red-50'
              : undefined
          }
        >
          <div className="flex items-center gap-3">
            <RotateCcw className={stats.overdue_orders > 0 ? 'h-6 w-6 text-danger' : 'h-6 w-6 text-text-sub'} />
            <div>
              <p className="text-sm text-text-sub">Pesanan Overdue</p>
              <p
                className={
                  stats.overdue_orders > 0
                    ? 'mt-1 text-2xl font-bold text-danger'
                    : 'mt-1 text-2xl font-bold text-text'
                }
              >
                {stats.overdue_orders}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
