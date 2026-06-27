import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type CardVariant = 'default' | 'hover' | 'selected'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  children: ReactNode
}

const variantClasses: Record<CardVariant, string> = {
  default: '',
  hover: 'card-interactive',
  selected: 'border-brand-500 ring-1 ring-brand-500',
}

export function Card({ variant = 'default', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-200 bg-white p-4 [box-shadow:var(--shadow-card)]',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
