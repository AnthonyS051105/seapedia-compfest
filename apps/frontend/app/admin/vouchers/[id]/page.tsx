'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Ticket } from 'lucide-react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ApiResponse, Voucher } from '@/types'

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDiscountValue(voucher: Voucher): string {
  return voucher.discount_type === 'PERCENTAGE' ? `${voucher.discount_value}%` : formatRupiah(voucher.discount_value)
}

function getExpiryInfo(expiryDate: string): { label: string; variant: 'green' | 'red' | 'yellow' } {
  const diffMs = new Date(expiryDate).getTime() - Date.now()
  if (diffMs <= 0) {
    return { label: 'Kadaluarsa', variant: 'red' }
  }
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return { label: `Aktif (${daysLeft} hari lagi)`, variant: daysLeft <= 7 ? 'yellow' : 'green' }
}

export default function AdminVoucherDetailPage() {
  const params = useParams<{ id: string }>()
  const [voucher, setVoucher] = useState<Voucher | null | undefined>(undefined)

  useEffect(() => {
    api
      .get<ApiResponse<Voucher>>(`/admin/vouchers/${params.id}`)
      .then((res) => setVoucher(res.data.data))
      .catch(() => setVoucher(null))
  }, [params.id])

  if (voucher === undefined) {
    return (
      <div className="mx-auto max-w-2xl">
        <Skeleton height={320} />
      </div>
    )
  }

  if (!voucher) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href="/admin/vouchers"
          className="mb-6 inline-flex items-center gap-2 text-sm text-brand-600 hover:underline dark:text-brand-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Voucher
        </Link>
        <EmptyState icon={Ticket} title="Voucher tidak ditemukan" description="Voucher ini mungkin sudah dihapus." />
      </div>
    )
  }

  const usagePercent = voucher.max_usage > 0 ? Math.min(100, (voucher.current_usage / voucher.max_usage) * 100) : 0
  const expiryInfo = getExpiryInfo(voucher.expiry_date)

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/vouchers"
        className="mb-6 inline-flex items-center gap-2 text-sm text-brand-600 hover:underline dark:text-brand-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Daftar Voucher
      </Link>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm text-zinc-500">Kode Voucher</p>
            <p className="font-mono text-3xl font-bold tracking-wider text-zinc-950 dark:text-zinc-50">
              {voucher.code}
            </p>
          </div>
          <Badge variant={voucher.is_active ? 'green' : 'gray'}>{voucher.is_active ? 'Active' : 'Inactive'}</Badge>
        </div>

        <div className="flex flex-col divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
          <div className="flex items-center justify-between py-3">
            <span className="text-zinc-500">Tipe</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {voucher.discount_type === 'PERCENTAGE' ? 'Persentase' : 'Nominal'}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-zinc-500">Nilai Diskon</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatDiscountValue(voucher)}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-zinc-500">Maks Diskon</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {voucher.max_discount_amount ? formatRupiah(voucher.max_discount_amount) : 'Tidak ada batas'}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-zinc-500">Min. Order</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {voucher.min_order_amount ? formatRupiah(voucher.min_order_amount) : 'Tidak ada minimum'}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-zinc-500">Kadaluarsa</span>
            <span className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
              {formatDate(voucher.expiry_date)}
              <Badge variant={expiryInfo.variant}>{expiryInfo.label}</Badge>
            </span>
          </div>
          <div className="py-3">
            <p className="mb-2 text-zinc-500">Penggunaan</p>
            <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-500">
              <span>
                {voucher.current_usage} / {voucher.max_usage}
              </span>
              <span>{Math.round(usagePercent)}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${usagePercent}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
