'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge, ORDER_STATUS_BADGE_VARIANT } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { TopUpModal } from '@/components/buyer/TopUpModal'
import { Reveal, RevealItem } from '@/components/ui/Reveal'
import { TiltCard } from '@/components/ui/TiltCard'
import { Magnetic } from '@/components/ui/Magnetic'
import { ApiResponse, BuyerOrder, OrderStatus, PaginatedResponse, User, WalletSummary } from '@/types'
import { Package } from 'lucide-react'

const STATUS_LABELS: Record<OrderStatus, string> = {
  SEDANG_DIKEMAS: 'Sedang Dikemas',
  MENUNGGU_PENGIRIM: 'Menunggu Pengirim',
  SEDANG_DIKIRIM: 'Sedang Dikirim',
  PESANAN_SELESAI: 'Pesanan Selesai',
  DIKEMBALIKAN: 'Dikembalikan',
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function BuyerDashboardPage() {
  const updateUser = useAuthStore((state) => state.updateUser)

  const [wallet, setWallet] = useState<WalletSummary | null | undefined>(undefined)
  const [orders, setOrders] = useState<BuyerOrder[] | null | undefined>(undefined)
  const [totalOrders, setTotalOrders] = useState<number | undefined>(undefined)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchWallet = () => {
    api
      .get<ApiResponse<WalletSummary>>('/buyer/wallet')
      .then((res) => setWallet(res.data.data))
      .catch(() => setWallet(null))
  }

  const fetchOrders = () => {
    api
      .get<PaginatedResponse<BuyerOrder>>('/buyer/orders', { params: { page: 1, limit: 5 } })
      .then((res) => {
        setOrders(res.data.data)
        setTotalOrders(res.data.meta.total)
      })
      .catch(() => setOrders(null))
  }

  useEffect(() => {
    fetchWallet()
    fetchOrders()
  }, [])

  const handleTopUpSuccess = () => {
    setIsModalOpen(false)
    fetchWallet()
    api
      .get<ApiResponse<User>>('/auth/me')
      .then((res) => updateUser(res.data.data))
      .catch(() => {
        // ignore — wallet card itself already shows the fresh balance
      })
  }

  const lastTransaction = wallet?.transactions[0]
  const activeOrdersCount = orders?.filter((o) => o.status !== 'PESANAN_SELESAI' && o.status !== 'DIKEMBALIKAN').length
  const completedOrdersCount = orders?.filter((o) => o.status === 'PESANAN_SELESAI').length

  return (
    <div className="flex flex-col gap-4">
      {wallet === undefined ? (
        <Skeleton height={104} className="rounded-2xl" />
      ) : (
        <Reveal>
          <TiltCard radiusClassName="rounded-2xl">
            <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Saldo Dompet</p>
                <p className="font-display text-4xl font-extrabold text-zinc-950 dark:text-zinc-50">
                  {formatRupiah(wallet?.balance ?? 0)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Magnetic>
                  <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
                    Top Up
                  </Button>
                </Magnetic>
                {lastTransaction && (
                  <p className="text-xs text-zinc-400">
                    Transaksi terakhir: {formatTimestamp(lastTransaction.created_at)}
                  </p>
                )}
              </div>
            </div>
          </TiltCard>
        </Reveal>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2" delay={0.05}>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 font-display font-semibold text-zinc-950 dark:text-zinc-50">Pesanan Terbaru</h2>

            {orders === undefined ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height={56} />
                ))}
              </div>
            ) : !orders || orders.length === 0 ? (
              <EmptyState icon={Package} title="Belum ada pesanan" description="Mulai belanja untuk melihat riwayat di sini." />
            ) : (
              <Reveal stagger staggerGap={0.06}>
                {orders.map((order) => (
                  <RevealItem key={order.id}>
                    <Link
                      href={`/buyer/orders/${order.id}`}
                      className="flex items-center justify-between border-b border-zinc-100 py-3 last:border-0 dark:border-zinc-800"
                    >
                      <div>
                        <p className="font-mono text-xs text-zinc-400">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-sm text-zinc-900 dark:text-zinc-100">{formatTimestamp(order.created_at)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {formatRupiah(order.final_total)}
                        </p>
                        <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status]}>{STATUS_LABELS[order.status]}</Badge>
                      </div>
                    </Link>
                  </RevealItem>
                ))}
              </Reveal>
            )}
          </div>
        </Reveal>

        <Reveal className="lg:col-span-1" delay={0.1}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Pesanan Aktif</span>
              <span className="font-display font-bold text-zinc-950 dark:text-zinc-50">
                {activeOrdersCount ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Pesanan Selesai</span>
              <span className="font-display font-bold text-zinc-950 dark:text-zinc-50">
                {completedOrdersCount ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Pesanan</span>
              <span className="font-display font-bold text-zinc-950 dark:text-zinc-50">{totalOrders ?? '—'}</span>
            </div>
          </div>
        </Reveal>
      </div>

      <TopUpModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleTopUpSuccess} />
    </div>
  )
}
