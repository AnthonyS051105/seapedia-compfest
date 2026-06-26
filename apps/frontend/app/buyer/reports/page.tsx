'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge, ORDER_STATUS_BADGE_VARIANT } from '@/components/ui/Badge'
import { FileBarChart } from 'lucide-react'
import { ApiResponse, SpendingReport } from '@/types'

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatMonthLabel(month: string): string {
  const [year, monthNum] = month.split('-')
  const date = new Date(Number(year), Number(monthNum) - 1, 1)
  return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
}

const STATUS_LABELS: Record<string, string> = {
  SEDANG_DIKEMAS: 'Sedang Dikemas',
  MENUNGGU_PENGIRIM: 'Menunggu Pengirim',
  SEDANG_DIKIRIM: 'Sedang Dikirim',
  PESANAN_SELESAI: 'Pesanan Selesai',
  DIKEMBALIKAN: 'Dikembalikan',
}

export default function BuyerReportsPage() {
  const [fromDateInput, setFromDateInput] = useState('')
  const [toDateInput, setToDateInput] = useState('')
  const [appliedFromDate, setAppliedFromDate] = useState('')
  const [appliedToDate, setAppliedToDate] = useState('')
  const requestKey = `${appliedFromDate}|${appliedToDate}`

  const [result, setResult] = useState<{ key: string; report: SpendingReport | null }>({
    key: '',
    report: null,
  })

  useEffect(() => {
    let isCurrent = true

    api
      .get<ApiResponse<SpendingReport>>('/buyer/reports', {
        params: {
          from_date: appliedFromDate ? new Date(appliedFromDate).toISOString() : undefined,
          to_date: appliedToDate ? new Date(appliedToDate).toISOString() : undefined,
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
  }, [appliedFromDate, appliedToDate, requestKey])

  const isLoading = result.key !== requestKey
  const report = isLoading ? undefined : result.report

  const maxSpending = report ? Math.max(1, ...report.monthly_breakdown.map((m) => m.total_spent)) : 1

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text">Laporan Pengeluaran</h1>

      <Card className="mb-6">
        <h2 className="mb-4 font-semibold text-text">Rentang Tanggal</h2>
        <div className="flex flex-wrap items-end gap-4">
          <Input
            type="date"
            label="Dari Tanggal"
            value={fromDateInput}
            onChange={(e) => setFromDateInput(e.target.value)}
          />
          <Input
            type="date"
            label="Sampai Tanggal"
            value={toDateInput}
            onChange={(e) => setToDateInput(e.target.value)}
          />
          <Button
            onClick={() => {
              setAppliedFromDate(fromDateInput)
              setAppliedToDate(toDateInput)
            }}
          >
            Terapkan Filter
          </Button>
        </div>
      </Card>

      {report === undefined ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={96} />
          ))}
        </div>
      ) : !report ? (
        <EmptyState
          icon={FileBarChart}
          title="Gagal memuat laporan"
          description="Terjadi kesalahan saat memuat laporan pengeluaran."
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Card>
              <p className="text-sm text-text-sub">Total Pengeluaran</p>
              <p className="mt-1 text-xl font-bold text-text">{formatRupiah(report.total_spent)}</p>
            </Card>
            <Card>
              <p className="text-sm text-text-sub">Jumlah Pesanan</p>
              <p className="mt-1 text-xl font-bold text-text">{report.order_count}</p>
            </Card>
            <Card>
              <p className="text-sm text-text-sub">Pesanan Selesai</p>
              <p className="mt-1 text-xl font-bold text-text">{report.orders_by_status.PESANAN_SELESAI}</p>
            </Card>
            <Card>
              <p className="text-sm text-text-sub">Dana Dikembalikan</p>
              <p className="mt-1 text-xl font-bold text-text">{report.orders_by_status.DIKEMBALIKAN}</p>
            </Card>
          </div>

          <Card className="mb-6">
            <h2 className="mb-4 font-semibold text-text">Pengeluaran per Bulan</h2>
            {report.monthly_breakdown.length === 0 ? (
              <p className="text-sm text-text-sub">Belum ada pesanan pada rentang ini.</p>
            ) : (
              <div className="flex items-end gap-4 overflow-x-auto pb-2" style={{ minHeight: 180 }}>
                {report.monthly_breakdown.map((entry) => (
                  <div key={entry.month} className="flex w-16 shrink-0 flex-col items-center gap-2">
                    <p className="text-xs font-medium text-text">{formatRupiah(entry.total_spent)}</p>
                    <div
                      className="w-10 rounded-t-md bg-primary"
                      style={{ height: Math.max(8, (entry.total_spent / maxSpending) * 120) }}
                      title={`${entry.order_count} pesanan`}
                    />
                    <p className="text-xs text-text-sub">{formatMonthLabel(entry.month)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold text-text">Daftar Pesanan</h2>
            {report.orders.length === 0 ? (
              <EmptyState title="Belum ada pesanan" description="Pesananmu akan muncul di sini." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-sub">
                      <th className="py-2 pr-4 font-medium">Order ID</th>
                      <th className="py-2 pr-4 font-medium">Tanggal</th>
                      <th className="py-2 pr-4 font-medium">Toko</th>
                      <th className="py-2 pr-4 font-medium">Total</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.orders.map((order) => (
                      <tr key={order.id} className="border-b border-border last:border-0">
                        <td className="py-3 pr-4 font-medium text-text">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="py-3 pr-4 text-text-sub">{formatDate(order.created_at)}</td>
                        <td className="py-3 pr-4 text-text-sub">{order.store_name}</td>
                        <td className="py-3 pr-4 text-text">{formatRupiah(order.final_total)}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status]}>
                            {STATUS_LABELS[order.status] ?? order.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
