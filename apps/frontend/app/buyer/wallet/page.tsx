'use client'

import { useEffect, useState } from 'react'
import { Wallet as WalletIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { TopUpModal } from '@/components/buyer/TopUpModal'
import { ApiResponse, User, WalletSummary, WalletTransactionType } from '@/types'

const TRANSACTION_LABELS: Record<WalletTransactionType, string> = {
  TOP_UP: 'Top Up',
  PAYMENT: 'Pembayaran',
  REFUND: 'Pengembalian Dana',
}

const DOT_CLASSES: Record<WalletTransactionType, string> = {
  TOP_UP: 'bg-success-500',
  PAYMENT: 'bg-zinc-400',
  REFUND: 'bg-brand-500',
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

export default function BuyerWalletPage() {
  const updateUser = useAuthStore((state) => state.updateUser)
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
    api
      .get<ApiResponse<User>>('/auth/me')
      .then((res) => updateUser(res.data.data))
      .catch(() => {
        // ignore — wallet page itself already shows the fresh balance
      })
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">Dompet Saya</h1>

      {wallet === undefined ? (
        <Skeleton height={160} className="max-w-sm rounded-2xl" />
      ) : (
        <div className="max-w-sm rounded-2xl border border-brand-200 bg-linear-to-br from-brand-50 to-white p-6 dark:border-brand-500/30 dark:from-brand-500/10 dark:to-zinc-950">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
            Saldo Tersedia
          </p>
          <p className="mt-1 font-display text-4xl font-extrabold text-zinc-950 dark:text-zinc-50">
            {formatRupiah(wallet?.balance ?? 0)}
          </p>
          <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
            Top Up
          </Button>
        </div>
      )}

      <h2 className="mb-2 mt-8 font-display font-semibold text-zinc-950 dark:text-zinc-50">Riwayat Transaksi</h2>

      {wallet === undefined ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={56} />
          ))}
        </div>
      ) : !wallet || wallet.transactions.length === 0 ? (
        <EmptyState icon={WalletIcon} title="Belum ada transaksi" description="Riwayat transaksi akan tampil di sini." />
      ) : (
        <div>
          {wallet.transactions.map((txn) => (
            <div key={txn.id} className="flex gap-4 border-b border-zinc-100 py-3 last:border-0 dark:border-zinc-800">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_CLASSES[txn.type]}`} />
              <div className="flex-1">
                <p className="text-sm text-zinc-900 dark:text-zinc-100">{TRANSACTION_LABELS[txn.type]}</p>
                <p className="text-xs text-zinc-500">{formatTimestamp(txn.created_at)}</p>
              </div>
              <p
                className={`ml-auto shrink-0 font-semibold ${
                  txn.type === 'PAYMENT' ? 'text-zinc-600 dark:text-zinc-400' : 'text-success-600 dark:text-success-500'
                }`}
              >
                {txn.type === 'PAYMENT' ? '-' : '+'}
                {formatRupiah(txn.amount)}
              </p>
            </div>
          ))}
        </div>
      )}

      <TopUpModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleTopUpSuccess} />
    </div>
  )
}
