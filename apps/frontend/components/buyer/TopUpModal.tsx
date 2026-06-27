'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { createResolver } from '@/lib/validation/resolver'
import { TopUpFormSchema, TopUpFormData } from '@/lib/validation/buyer.schema'
import { ApiErrorResponse } from '@/types'

const QUICK_AMOUNTS = [50_000, 100_000, 250_000, 500_000, 1_000_000]

export function TopUpModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TopUpFormData>({ resolver: createResolver(TopUpFormSchema) })

  const handleClose = () => {
    reset()
    setApiError(null)
    onClose()
  }

  const onSubmit = async (formData: TopUpFormData) => {
    setApiError(null)
    try {
      await api.post('/buyer/wallet/topup', { amount: formData.amount })
      toast.success('Top up berhasil')
      reset()
      onSuccess()
    } catch (error) {
      const apiErr = error as { response?: { data?: ApiErrorResponse } }
      const response = apiErr.response?.data

      if (response?.errors?.length) {
        response.errors.forEach((fieldError) => {
          setError(fieldError.field as keyof TopUpFormData, { message: fieldError.message })
        })
      }
      setApiError(response?.message ?? 'Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Top Up Saldo">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Jumlah Top Up (Rp)"
          type="number"
          placeholder="500000"
          error={errors.amount?.message}
          {...register('amount')}
        />

        <div>
          <p className="mb-2 text-sm text-zinc-500">Pilih nominal cepat:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setValue('amount', amount, { shouldValidate: true })}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {amount >= 1_000_000 ? `${amount / 1_000_000}JT` : `${amount / 1000}K`}
              </button>
            ))}
          </div>
        </div>

        {apiError && <p className="text-sm text-danger-600 dark:text-danger-500">{apiError}</p>}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Top Up
          </Button>
        </div>
      </form>
    </Modal>
  )
}
