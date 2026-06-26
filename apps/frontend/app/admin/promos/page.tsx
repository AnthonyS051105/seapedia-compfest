'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Megaphone } from 'lucide-react'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { createResolver } from '@/lib/validation/resolver'
import { CreatePromoFormSchema, CreatePromoFormData } from '@/lib/validation/discount.schema'
import { ApiErrorResponse, FieldError, PaginatedResponse, Promo } from '@/types'

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDiscountValue(promo: Promo): string {
  return promo.discount_type === 'PERCENTAGE' ? `${promo.discount_value}%` : formatRupiah(promo.discount_value)
}

export default function AdminPromosPage() {
  return (
    <Suspense>
      <AdminPromosPageContent />
    </Suspense>
  )
}

function AdminPromosPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const [result, setResult] = useState<{
    key: number
    promos: Promo[]
    meta: { totalPages: number }
  } | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchPromos = () => {
    api
      .get<PaginatedResponse<Promo>>('/admin/promos', { params: { page, limit: 10 } })
      .then((res) => {
        setResult({ key: page, promos: res.data.data, meta: { totalPages: res.data.meta.totalPages } })
      })
      .catch(() => {
        setResult({ key: page, promos: [], meta: { totalPages: 0 } })
      })
  }

  useEffect(() => {
    fetchPromos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const isLoading = result?.key !== page
  const promos = isLoading ? null : result.promos
  const meta = isLoading ? null : result.meta

  const handleCreated = () => {
    setIsModalOpen(false)
    fetchPromos()
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Promo</h1>
        <Button onClick={() => setIsModalOpen(true)}>+ Buat Promo</Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={56} />
          ))}
        </div>
      ) : !promos || promos.length === 0 ? (
        <EmptyState icon={Megaphone} title="Belum ada promo" description="Buat promo pertama untuk buyer." />
      ) : (
        <>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-sub">
                  <th className="px-4 py-3 font-medium">Kode</th>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Tipe</th>
                  <th className="px-4 py-3 font-medium">Nilai</th>
                  <th className="px-4 py-3 font-medium">Kadaluarsa</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((promo) => (
                  <tr key={promo.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/admin/promos/${promo.id}`} className="text-primary hover:underline">
                        {promo.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text">{promo.name}</td>
                    <td className="px-4 py-3 text-text-sub">
                      {promo.discount_type === 'PERCENTAGE' ? 'Persentase' : 'Nominal'}
                    </td>
                    <td className="px-4 py-3 text-text">{formatDiscountValue(promo)}</td>
                    <td className="px-4 py-3 text-text-sub">{formatDate(promo.expiry_date)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={promo.is_active ? 'green' : 'gray'}>
                        {promo.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {meta && meta.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              onPageChange={(nextPage) => router.push(`/admin/promos?page=${nextPage}`)}
              className="mt-6"
            />
          )}
        </>
      )}

      <CreatePromoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={handleCreated} />
    </div>
  )
}

function CreatePromoModal({
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
  } = useForm<CreatePromoFormData>({
    resolver: createResolver(CreatePromoFormSchema),
    defaultValues: { discount_type: 'PERCENTAGE', is_active: true },
  })

  const handleClose = () => {
    reset()
    setApiError(null)
    onClose()
  }

  const onSubmit = async (formData: CreatePromoFormData) => {
    setApiError(null)
    try {
      await api.post('/admin/promos', {
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        max_discount_amount: formData.max_discount_amount || undefined,
        min_order_amount: formData.min_order_amount || undefined,
        expiry_date: new Date(formData.expiry_date).toISOString(),
        is_active: formData.is_active,
      })
      toast.success('Promo berhasil dibuat')
      reset()
      onCreated()
    } catch (error) {
      const apiErr = error as { response?: { data?: ApiErrorResponse } }
      const response = apiErr.response?.data

      if (response?.errors?.length) {
        response.errors.forEach((fieldError: FieldError) => {
          setError(fieldError.field as keyof CreatePromoFormData, { message: fieldError.message })
        })
      }
      setApiError(response?.message ?? 'Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Buat Promo Baru" className="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Kode Promo"
          placeholder="PROMO15"
          error={errors.code?.message}
          {...register('code')}
        />

        <Input
          label="Nama Promo"
          placeholder="Promo Spesial 17an"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Deskripsi (Opsional)"
          placeholder="Diskon spesial untuk perayaan kemerdekaan"
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-text">Tipe Diskon</label>
          <select
            className="h-10 rounded-lg border border-border bg-surface px-3 text-base text-text outline-none focus:border-primary"
            {...register('discount_type')}
          >
            <option value="PERCENTAGE">Persentase (%)</option>
            <option value="FIXED_AMOUNT">Nominal (Rp)</option>
          </select>
        </div>

        <Input
          label="Nilai Diskon"
          type="number"
          placeholder="15"
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
          label="Tanggal Kadaluarsa"
          type="date"
          error={errors.expiry_date?.message}
          {...register('expiry_date')}
        />

        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" defaultChecked {...register('is_active')} />
          Aktifkan promo ini
        </label>

        {apiError && <p className="text-sm text-danger">{apiError}</p>}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Buat Promo
          </Button>
        </div>
      </form>
    </Modal>
  )
}
