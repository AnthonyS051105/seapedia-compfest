import { cn } from '@/lib/utils'
import { OrderStatus, OrderStatusHistoryEntry } from '@/types'

const STATUS_ORDER: OrderStatus[] = [
  'SEDANG_DIKEMAS',
  'MENUNGGU_PENGIRIM',
  'SEDANG_DIKIRIM',
  'PESANAN_SELESAI',
]

const STATUS_LABELS: Record<OrderStatus, string> = {
  SEDANG_DIKEMAS: 'Sedang Dikemas',
  MENUNGGU_PENGIRIM: 'Menunggu Pengirim',
  SEDANG_DIKIRIM: 'Sedang Dikirim',
  PESANAN_SELESAI: 'Pesanan Selesai',
  DIKEMBALIKAN: 'Dikembalikan',
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

export interface OrderStatusTimelineProps {
  history: OrderStatusHistoryEntry[]
  currentStatus: OrderStatus
  className?: string
}

export function OrderStatusTimeline({ history, currentStatus, className }: OrderStatusTimelineProps) {
  const isReturned = currentStatus === 'DIKEMBALIKAN'
  const historyByStatus = new Map(history.map((entry) => [entry.status, entry]))

  const steps = isReturned
    ? [...STATUS_ORDER.filter((status) => historyByStatus.has(status)), 'DIKEMBALIKAN' as OrderStatus]
    : STATUS_ORDER

  const currentIndex = steps.indexOf(currentStatus)

  return (
    <div className={cn('flex flex-col gap-0', className)}>
      {steps.map((status, index) => {
        const entry = historyByStatus.get(status)
        const isCompleted = isReturned ? index < steps.length - 1 || status === 'DIKEMBALIKAN' : index <= currentIndex
        const isCurrent = status === currentStatus
        const isLast = index === steps.length - 1

        return (
          <div key={status} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'h-3 w-3 shrink-0 rounded-full',
                  status === 'DIKEMBALIKAN' && isCompleted
                    ? 'bg-danger-500'
                    : isCompleted && !isCurrent
                      ? 'bg-brand-500'
                      : isCurrent
                        ? 'bg-brand-500 ring-4 ring-brand-500/20'
                        : 'border-2 border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900'
                )}
              />
              {!isLast && <div className="w-0.5 flex-1 bg-zinc-200 dark:bg-zinc-800" />}
            </div>

            <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
              <p
                className={cn(
                  'text-sm',
                  isCompleted || isCurrent
                    ? 'font-semibold text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-400 dark:text-zinc-600'
                )}
              >
                {STATUS_LABELS[status]}
              </p>
              <p className="text-xs text-zinc-500">{entry ? formatTimestamp(entry.created_at) : 'Menunggu'}</p>
              {entry?.note && <p className="mt-1 text-xs text-zinc-500">{entry.note}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
