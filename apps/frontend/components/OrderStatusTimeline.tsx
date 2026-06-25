import { CheckCircle2, Circle, Loader2, Package, PackageCheck, RotateCcw, Truck } from 'lucide-react'
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

const STATUS_ICONS: Record<OrderStatus, typeof Package> = {
  SEDANG_DIKEMAS: Package,
  MENUNGGU_PENGIRIM: PackageCheck,
  SEDANG_DIKIRIM: Truck,
  PESANAN_SELESAI: CheckCircle2,
  DIKEMBALIKAN: RotateCcw,
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
    <div className={cn('flex flex-col', className)}>
      {steps.map((status, index) => {
        const entry = historyByStatus.get(status)
        const isCompleted = isReturned ? index < steps.length - 1 || status === 'DIKEMBALIKAN' : index <= currentIndex
        const isCurrent = status === currentStatus
        const isLast = index === steps.length - 1
        const Icon = entry ? STATUS_ICONS[status] : Circle

        return (
          <div key={status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                  isCompleted
                    ? status === 'DIKEMBALIKAN'
                      ? 'border-danger bg-danger text-white'
                      : 'border-secondary bg-secondary text-white'
                    : isCurrent
                      ? 'border-primary text-primary'
                      : 'border-border text-text-sub'
                )}
              >
                {isCurrent && !entry ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              {!isLast && (
                <div className={cn('w-0.5 flex-1', isCompleted ? 'bg-secondary' : 'bg-border')} />
              )}
            </div>

            <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
              <p className={cn('text-sm font-semibold', isCompleted || isCurrent ? 'text-text' : 'text-text-sub')}>
                {STATUS_LABELS[status]}
              </p>
              <p className="text-xs text-text-sub">
                {entry ? formatTimestamp(entry.created_at) : 'Menunggu'}
              </p>
              {entry?.note && <p className="mt-1 text-xs text-text-sub">{entry.note}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
