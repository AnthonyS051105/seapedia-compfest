'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Megaphone } from 'lucide-react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Reveal } from '@/components/ui/Reveal'
import { ApiResponse, Promo } from '@/types'

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDiscountValue(promo: Promo): string {
  return promo.discount_type === 'PERCENTAGE' ? `${promo.discount_value}%` : formatRupiah(promo.discount_value)
}

function getExpiryInfo(expiryDate: string): { label: string; variant: 'green' | 'red' | 'yellow' } {
  const diffMs = new Date(expiryDate).getTime() - Date.now()
  if (diffMs <= 0) {
    return { label: 'Kadaluarsa', variant: 'red' }
  }
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return { label: `Aktif (${daysLeft} hari lagi)`, variant: daysLeft <= 7 ? 'yellow' : 'green' }
}

export default function AdminPromoDetailPage() {
  const params = useParams<{ id: string }>()
  const [promo, setPromo] = useState<Promo | null | undefined>(undefined)

  useEffect(() => {
    api
      .get<ApiResponse<Promo>>(`/admin/promos/${params.id}`)
      .then((res) => setPromo(res.data.data))
      .catch(() => setPromo(null))
  }, [params.id])

  if (promo === undefined) {
    return (
      <div className="mx-auto max-w-2xl">
        <Skeleton height={320} />
      </div>
    )
  }

  if (!promo) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link href="/admin/promos" className="mb-6 inline-flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Promo
        </Link>
        <EmptyState icon={Megaphone} title="Promo tidak ditemukan" description="Promo ini mungkin sudah dihapus." />
      </div>
    )
  }

  const expiryInfo = getExpiryInfo(promo.expiry_date)

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/promos" className="mb-6 inline-flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Daftar Promo
      </Link>

      <Reveal>
      <Card>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Kode Promo</p>
            <p className="font-mono text-3xl font-bold tracking-wider text-zinc-950 dark:text-zinc-50">{promo.code}</p>
          </div>
          <Badge variant={promo.is_active ? 'green' : 'gray'}>{promo.is_active ? 'Aktif' : 'Tidak Aktif'}</Badge>
        </div>

        <dl className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
          <div className="flex items-center justify-between py-3">
            <dt className="text-zinc-600 dark:text-zinc-400">Nama Promo</dt>
            <dd className="font-medium text-zinc-950 dark:text-zinc-50">{promo.name}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-zinc-600 dark:text-zinc-400">Deskripsi</dt>
            <dd className="font-medium text-zinc-950 dark:text-zinc-50">{promo.description ?? '-'}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-zinc-600 dark:text-zinc-400">Tipe</dt>
            <dd className="font-medium text-zinc-950 dark:text-zinc-50">
              {promo.discount_type === 'PERCENTAGE' ? 'Persentase' : 'Nominal'}
            </dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-zinc-600 dark:text-zinc-400">Nilai Diskon</dt>
            <dd className="font-medium text-zinc-950 dark:text-zinc-50">{formatDiscountValue(promo)}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-zinc-600 dark:text-zinc-400">Maks Diskon</dt>
            <dd className="font-medium text-zinc-950 dark:text-zinc-50">
              {promo.max_discount_amount ? formatRupiah(promo.max_discount_amount) : 'Tidak ada batas'}
            </dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-zinc-600 dark:text-zinc-400">Min. Order</dt>
            <dd className="font-medium text-zinc-950 dark:text-zinc-50">
              {promo.min_order_amount ? formatRupiah(promo.min_order_amount) : 'Tidak ada minimum'}
            </dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-zinc-600 dark:text-zinc-400">Kadaluarsa</dt>
            <dd className="flex items-center gap-2 font-medium text-zinc-950 dark:text-zinc-50">
              {formatDate(promo.expiry_date)}
              <Badge variant={expiryInfo.variant}>{expiryInfo.label}</Badge>
            </dd>
          </div>
        </dl>
      </Card>
      </Reveal>
    </div>
  )
}
