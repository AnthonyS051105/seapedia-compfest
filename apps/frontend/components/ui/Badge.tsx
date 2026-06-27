import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { OrderStatus } from '@/types'

export type BadgeVariant =
  | 'blue'
  | 'green'
  | 'yellow'
  | 'red'
  | 'gray'
  | 'orange'
  | 'success'
  | 'warning'
  | 'info'
  | 'neutral'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  children: ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  yellow: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
  blue: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30',
  orange: 'bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/30',
  green: 'bg-success-50 text-success-700 border border-green-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/30',
  red: 'bg-danger-50 text-danger-700 border border-red-200 dark:bg-danger-500/10 dark:text-danger-400 dark:border-danger-500/30',
  gray: 'bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
  success: 'bg-success-50 text-success-700 border border-green-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/30',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
  info: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30',
  neutral: 'bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
}

export const ORDER_STATUS_BADGE_VARIANT: Record<OrderStatus, BadgeVariant> = {
  SEDANG_DIKEMAS: 'yellow',
  MENUNGGU_PENGIRIM: 'blue',
  SEDANG_DIKIRIM: 'orange',
  PESANAN_SELESAI: 'green',
  DIKEMBALIKAN: 'red',
}

export function Badge({ variant = 'gray', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
