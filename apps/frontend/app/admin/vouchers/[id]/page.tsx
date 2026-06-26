'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Ticket } from 'lucide-react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
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
        <Link href="/admin/vouchers" className="mb-6 inline-flex items-center gap-2 text-sm text-primary hover:underline">
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
      <Link href="/admin/vouchers" className="mb-6 inline-flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Daftar Voucher
      </Link>

      <Card>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm text-text-sub">Kode Voucher</p>
            <p className="font-mono text-3xl font-bold tracking-wider text-text">{voucher.code}</p>
          </div>
          <Badge variant={voucher.is_active ? 'green' : 'gray'}>{voucher.is_active ? 'Active' : 'Inactive'}</Badge>
        </div>

        <dl className="flex flex-col divide-y divide-border text-sm">
          <div className="flex items-center justify-between py-3">
            <dt className="text-text-sub">Tipe</dt>
            <dd className="font-medium text-text">
              {voucher.discount_type === 'PERCENTAGE' ? 'Persentase' : 'Nominal'}
            </dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-text-sub">Nilai Diskon</dt>
            <dd className="font-medium text-text">{formatDiscountValue(voucher)}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-text-sub">Maks Diskon</dt>
            <dd className="font-medium text-text">
              {voucher.max_discount_amount ? formatRupiah(voucher.max_discount_amount) : 'Tidak ada batas'}
            </dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-text-sub">Min. Order</dt>
            <dd className="font-medium text-text">
              {voucher.min_order_amount ? formatRupiah(voucher.min_order_amount) : 'Tidak ada minimum'}
            </dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-text-sub">Kadaluarsa</dt>
            <dd className="flex items-center gap-2 font-medium text-text">
              {formatDate(voucher.expiry_date)}
              <Badge variant={expiryInfo.variant}>{expiryInfo.label}</Badge>
            </dd>
          </div>
          <div className="py-3">
            <dt className="mb-2 text-text-sub">Penggunaan</dt>
            <dd>
              <div className="mb-1 flex items-center justify-between text-xs text-text-sub">
                <span>
                  {voucher.current_usage} / {voucher.max_usage}
                </span>
                <span>{Math.round(usagePercent)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-primary" style={{ width: `${usagePercent}%` }} />
              </div>
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}
