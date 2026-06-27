'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { createResolver } from '@/lib/validation/resolver'
import { CreateVoucherFormSchema, CreateVoucherFormData } from '@/lib/validation/discount.schema'
import { ApiErrorResponse, FieldError, PaginatedResponse, Voucher } from '@/types'

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDiscountValue(voucher: Voucher): string {
  return voucher.discount_type === 'PERCENTAGE' ? `${voucher.discount_value}%` : formatRupiah(voucher.discount_value)
}

export default function AdminVouchersPage() {
  return (
    <Suspense>
      <AdminVouchersPageContent />
    </Suspense>
  )
}

function AdminVouchersPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const [result, setResult] = useState<{
    key: number
    vouchers: Voucher[]
    meta: { totalPages: number }
  } | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchVouchers = () => {
    api
      .get<PaginatedResponse<Voucher>>('/admin/vouchers', { params: { page, limit: 10 } })
      .then((res) => {
        setResult({ key: page, vouchers: res.data.data, meta: { totalPages: res.data.meta.totalPages } })
      })
      .catch(() => {
        setResult({ key: page, vouchers: [], meta: { totalPages: 0 } })
      })
  }

  useEffect(() => {
    fetchVouchers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const isLoading = result?.key !== page
  const vouchers = isLoading ? null : result.vouchers
  const meta = isLoading ? null : result.meta

  const handleCreated = () => {
    setIsModalOpen(false)
    fetchVouchers()
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">Voucher</h1>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          + Buat Voucher
        </Button>
      </div>

      {isLoading ? (
        <Skeleton height={300} className="rounded-xl" />
      ) : !vouchers || vouchers.length === 0 ? (
        <EmptyState icon={Tag} title="Belum ada voucher" description="Buat voucher pertama untuk buyer." />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Kode</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Tipe</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Nilai</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Pemakaian
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Kadaluarsa
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((voucher) => {
                  const usagePercent =
                    voucher.max_usage > 0 ? Math.min(100, (voucher.current_usage / voucher.max_usage) * 100) : 0

                  return (
                    <tr
                      key={voucher.id}
                      className="border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/vouchers/${voucher.id}`}
                          className="font-mono text-sm text-brand-600 hover:underline dark:text-brand-400"
                        >
                          {voucher.code}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {voucher.discount_type === 'PERCENTAGE' ? 'Persentase' : 'Nominal'}
                      </td>
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{formatDiscountValue(voucher)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500">
                            {voucher.current_usage}/{voucher.max_usage}
                          </span>
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-brand-500"
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{formatDate(voucher.expiry_date)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={voucher.is_active ? 'green' : 'gray'}>
                          {voucher.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              onPageChange={(nextPage) => router.push(`/admin/vouchers?page=${nextPage}`)}
              className="mt-6"
            />
          )}
        </>
      )}

      <CreateVoucherModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={handleCreated} />
    </div>
  )
}

function CreateVoucherModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateVoucherFormData>({
    resolver: createResolver(CreateVoucherFormSchema),
    defaultValues: { discount_type: 'PERCENTAGE', is_active: true },
  })

  const handleClose = () => {
    reset()
    setApiError(null)
    onClose()
  }

  const onSubmit = async (formData: CreateVoucherFormData) => {
    setApiError(null)
    try {
      await api.post('/admin/vouchers', {
        code: formData.code,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        max_discount_amount: formData.max_discount_amount || undefined,
        min_order_amount: formData.min_order_amount || undefined,
        expiry_date: new Date(formData.expiry_date).toISOString(),
        max_usage: formData.max_usage,
        is_active: formData.is_active,
      })
      toast.success('Voucher berhasil dibuat')
      reset()
      onCreated()
    } catch (error) {
      const apiErr = error as { response?: { data?: ApiErrorResponse } }
      const response = apiErr.response?.data

      if (response?.errors?.length) {
        response.errors.forEach((fieldError: FieldError) => {
          setError(fieldError.field as keyof CreateVoucherFormData, { message: fieldError.message })
        })
      }
      setApiError(response?.message ?? 'Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Buat Voucher Baru" className="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Kode Voucher"
          placeholder="HEMAT10"
          error={errors.code?.message}
          {...register('code')}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipe Diskon</label>
          <select
            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            {...register('discount_type')}
          >
            <option value="PERCENTAGE">Persentase (%)</option>
            <option value="FIXED_AMOUNT">Nominal (Rp)</option>
          </select>
        </div>

        <Input
          label="Nilai Diskon"
          type="number"
          placeholder="10"
          error={errors.discount_value?.message}
          {...register('discount_value')}
        />

        <Input
          label="Batas Maksimal Diskon (Opsional)"
          type="number"
          placeholder="50000"
          error={errors.max_discount_amount?.message}
          {...register('max_discount_amount')}
        />

        <Input
          label="Minimal Order (Opsional)"
          type="number"
          placeholder="100000"
          error={errors.min_order_amount?.message}
          {...register('min_order_amount')}
        />

        <Input
          label="Maksimal Pemakaian"
          type="number"
          placeholder="100"
          error={errors.max_usage?.message}
          {...register('max_usage')}
        />

        <Input
          label="Tanggal Kadaluarsa"
          type="date"
          error={errors.expiry_date?.message}
          {...register('expiry_date')}
        />

        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" defaultChecked className="accent-brand-500" {...register('is_active')} />
          Aktifkan voucher ini
        </label>

        {apiError && <p className="text-sm text-danger-600 dark:text-danger-500">{apiError}</p>}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Buat Voucher
          </Button>
        </div>
      </form>
    </Modal>
  )
}
