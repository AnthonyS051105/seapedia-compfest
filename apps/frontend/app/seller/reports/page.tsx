'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
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
      <h1 className="mb-6 text-2xl font-bold text-text">Laporan Pendapatan</h1>

      <Card className="mb-6">
        <h2 className="mb-4 font-semibold text-text">Rentang Tanggal</h2>
        <div className="flex flex-wrap gap-4">
          <Input
            type="date"
            label="Dari Tanggal"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <Input
            type="date"
            label="Sampai Tanggal"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </Card>

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
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-sm text-text-sub">Total Pendapatan</p>
              <p className="mt-1 text-xl font-bold text-text">{formatRupiah(report.total_income)}</p>
            </Card>
            <Card>
              <p className="text-sm text-text-sub">Jumlah Pesanan</p>
              <p className="mt-1 text-xl font-bold text-text">{report.order_count}</p>
            </Card>
            <Card>
              <p className="text-sm text-text-sub">Rata-rata per Pesanan</p>
              <p className="mt-1 text-xl font-bold text-text">{formatRupiah(report.average_order_value)}</p>
            </Card>
          </div>

          <Card>
            <h2 className="mb-4 font-semibold text-text">Pendapatan per Bulan</h2>
            {report.period_breakdown.length === 0 ? (
              <p className="text-sm text-text-sub">Belum ada pesanan selesai pada rentang ini.</p>
            ) : (
              <div className="flex items-end gap-4 overflow-x-auto pb-2" style={{ minHeight: 180 }}>
                {report.period_breakdown.map((entry) => (
                  <div key={entry.period} className="flex w-16 shrink-0 flex-col items-center gap-2">
                    <p className="text-xs font-medium text-text">{formatRupiah(entry.income)}</p>
                    <div
                      className="w-10 rounded-t-md bg-primary"
                      style={{ height: Math.max(8, (entry.income / maxIncome) * 120) }}
                      title={`${entry.order_count} pesanan`}
                    />
                    <p className="text-xs text-text-sub">{formatPeriodLabel(entry.period)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
