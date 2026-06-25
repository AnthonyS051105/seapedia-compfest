'use client'

import { useEffect, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Wallet as WalletIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { createResolver } from '@/lib/validation/resolver'
import { TopUpFormSchema, TopUpFormData } from '@/lib/validation/buyer.schema'
import { ApiErrorResponse, ApiResponse, WalletSummary, WalletTransactionType } from '@/types'

const QUICK_AMOUNTS = [50_000, 100_000, 250_000, 500_000, 1_000_000]

const TRANSACTION_LABELS: Record<WalletTransactionType, string> = {
  TOP_UP: 'Top Up',
  PAYMENT: 'Pembayaran',
  REFUND: 'Pengembalian Dana',
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function TransactionIcon({ type }: { type: WalletTransactionType }) {
  if (type === 'PAYMENT') {
    return <ArrowDownCircle className="h-5 w-5 text-danger" />
  }
  if (type === 'REFUND') {
    return <ArrowUpCircle className="h-5 w-5 text-blue-600" />
  }
  return <ArrowUpCircle className="h-5 w-5 text-secondary" />
}

export default function BuyerWalletPage() {
  const [wallet, setWallet] = useState<WalletSummary | null | undefined>(undefined)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchWallet = () => {
    api
      .get<ApiResponse<WalletSummary>>('/buyer/wallet')
      .then((res) => setWallet(res.data.data))
      .catch(() => setWallet(null))
  }

  useEffect(() => {
    fetchWallet()
  }, [])

  const handleTopUpSuccess = () => {
    setIsModalOpen(false)
    fetchWallet()
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-text">Dompet Saya</h1>

      {wallet === undefined ? (
        <Skeleton height={120} />
      ) : (
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-sub">Saldo Tersedia</p>
            <p className="mt-1 text-2xl font-bold text-text">{formatRupiah(wallet?.balance ?? 0)}</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>Top Up</Button>
        </Card>
      )}

      <h2 className="mb-4 mt-8 font-semibold text-text">Riwayat Transaksi</h2>

      {wallet === undefined ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={64} />
          ))}
        </div>
      ) : !wallet || wallet.transactions.length === 0 ? (
        <EmptyState icon={WalletIcon} title="Belum ada transaksi" description="Riwayat transaksi akan tampil di sini." />
      ) : (
        <div className="flex flex-col gap-3">
          {wallet.transactions.map((txn) => (
            <Card key={txn.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TransactionIcon type={txn.type} />
                  <div>
                    <p className="font-medium text-text">{TRANSACTION_LABELS[txn.type]}</p>
                    <p className="text-xs text-text-sub">{formatTimestamp(txn.created_at)}</p>
                  </div>
                </div>
                <p className={txn.type === 'PAYMENT' ? 'font-semibold text-danger' : 'font-semibold text-secondary'}>
                  {txn.type === 'PAYMENT' ? '-' : '+'}
                  {formatRupiah(txn.amount)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <TopUpModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleTopUpSuccess} />
    </div>
  )
}

function TopUpModal({
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
          <p className="mb-2 text-sm text-text-sub">Pilih nominal cepat:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setValue('amount', amount, { shouldValidate: true })}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text hover:bg-gray-50"
              >
                {amount >= 1_000_000 ? `${amount / 1_000_000}JT` : `${amount / 1000}K`}
              </button>
            ))}
          </div>
        </div>

        {apiError && <p className="text-sm text-danger">{apiError}</p>}

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
