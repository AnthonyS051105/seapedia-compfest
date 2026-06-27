'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { FileBarChart } from 'lucide-react'
import { ApiResponse, IncomeReport } from '@/types'

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
}

export default function SellerReportsPage() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const requestKey = `${fromDate}|${toDate}`

  const [result, setResult] = useState<{ key: string; report: IncomeReport | null }>({
    key: '',
    report: null,
  })

  useEffect(() => {
    let isCurrent = true

    api
      .get<ApiResponse<IncomeReport>>('/seller/reports/income', {
        params: {
          from_date: fromDate ? new Date(fromDate).toISOString() : undefined,
          to_date: toDate ? new Date(toDate).toISOString() : undefined,
        },
      })
      .then((res) => {
        if (!isCurrent) return
        setResult({ key: requestKey, report: res.data.data })
      })
      .catch(() => {
        if (!isCurrent) return
        setResult({ key: requestKey, report: null })
      })

    return () => {
      isCurrent = false
    }
  }, [fromDate, toDate, requestKey])

  const isLoading = result.key !== requestKey
  const report = isLoading ? undefined : result.report

  const maxIncome = report ? Math.max(1, ...report.period_breakdown.map((p) => p.income)) : 1

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">Laporan Pendapatan</h1>

      <div className="mb-8 flex flex-wrap gap-3">
        <Input type="date" label="Dari Tanggal" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <Input type="date" label="Sampai Tanggal" value={toDate} onChange={(e) => setToDate(e.target.value)} />
      </div>

      {report === undefined ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={96} />
          ))}
        </div>
      ) : !report ? (
        <EmptyState
          icon={FileBarChart}
          title="Gagal memuat laporan"
          description="Terjadi kesalahan saat memuat laporan pendapatan."
        />
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">
                {formatRupiah(report.total_income)}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Total Pendapatan</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">{report.order_count}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Jumlah Pesanan</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">
                {formatRupiah(report.average_order_value)}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Rata-rata per Pesanan
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 font-display font-semibold text-zinc-950 dark:text-zinc-50">Pendapatan per Bulan</h2>
            {report.period_breakdown.length === 0 ? (
              <p className="text-sm text-zinc-500">Belum ada pesanan selesai pada rentang ini.</p>
            ) : (
              <div className="flex items-end gap-6 overflow-x-auto pb-2" style={{ minHeight: 180 }}>
                {report.period_breakdown.map((entry) => (
                  <div key={entry.period} className="flex w-12 shrink-0 flex-col items-center gap-2">
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {formatRupiah(entry.income)}
                    </p>
                    <div
                      className="w-8 rounded-t-md bg-brand-500"
                      style={{ height: Math.max(8, (entry.income / maxIncome) * 120) }}
                      title={`${entry.order_count} pesanan`}
                    />
                    <p className="text-xs text-zinc-500">{formatPeriodLabel(entry.period)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
