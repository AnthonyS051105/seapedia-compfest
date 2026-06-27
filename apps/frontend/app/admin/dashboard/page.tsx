'use client'

import { useEffect, useState } from 'react'
import { Users, Store, Package, ClipboardList, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
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

  const hasOverdue = (stats?.overdue_orders ?? 0) > 0

  const statCards = stats
    ? [
        { label: 'Pengguna', value: stats.users.total, icon: Users },
        { label: 'Toko', value: stats.stores.total, icon: Store },
        { label: 'Produk', value: stats.products.total, icon: Package },
        { label: 'Pesanan', value: stats.orders.total, icon: ClipboardList },
        { label: 'Pesanan Overdue', value: stats.overdue_orders, icon: RotateCcw, danger: hasOverdue },
      ]
    : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">Admin Dashboard</h1>
          <p className="text-zinc-500">Ringkasan marketplace</p>
        </div>

        <div className="flex items-center gap-3">
          {systemDate && stats && (
            <span
              className={cn(
                'rounded-full px-3 py-1.5 text-xs',
                stats.system_date_offset > 0
                  ? 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
              )}
            >
              {systemDate} (+{stats.system_date_offset} hari)
            </span>
          )}
          <button
            type="button"
            onClick={handleSimulateNextDay}
            disabled={isSimulating}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40',
              hasOverdue
                ? 'border border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-500/40 dark:text-amber-400 dark:hover:bg-amber-500/10'
                : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
            )}
          >
            <RotateCcw className="h-4 w-4" />
            Simulasi Hari Berikutnya
          </button>
        </div>
      </div>

      {!stats || !statCards ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={88} className="rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {statCards.map(({ label, value, icon: Icon, danger }) => (
            <div
              key={label}
              className={cn(
                'rounded-xl border p-5',
                danger
                  ? 'border-danger-200 bg-danger-50 dark:border-danger-500/30 dark:bg-danger-500/10'
                  : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-500">{label}</p>
                <Icon className={cn('h-4 w-4', danger ? 'text-danger-500' : 'text-zinc-400')} />
              </div>
              <p
                className={cn(
                  'mt-1 font-display text-xl font-bold',
                  danger ? 'text-danger-700 dark:text-danger-400' : 'text-zinc-950 dark:text-zinc-50'
                )}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {stats && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-3 text-sm font-medium text-zinc-500">Pesanan per Status</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {Object.entries(stats.orders.by_status).map(([status, count]) => (
              <div key={status} className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950">
                <p className="text-xs text-zinc-500">{status.replaceAll('_', ' ')}</p>
                <p className="mt-1 text-lg font-bold text-zinc-950 dark:text-zinc-50">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
