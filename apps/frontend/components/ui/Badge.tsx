import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { OrderStatus } from '@/types'

export type BadgeVariant = 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'orange'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  children: ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-emerald-100 text-emerald-700',
  yellow: 'bg-amber-100 text-amber-700',
  orange: 'bg-orange-100 text-orange-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-700',
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
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
