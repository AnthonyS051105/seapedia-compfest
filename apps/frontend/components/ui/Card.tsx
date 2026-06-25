import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type CardVariant = 'default' | 'hover' | 'selected'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  children: ReactNode
}

const variantClasses: Record<CardVariant, string> = {
  default: '',
  hover: 'transition-shadow hover:shadow-md',
  selected: 'border-primary ring-1 ring-primary',
}

export function Card({ variant = 'default', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-xl border border-border bg-surface p-4', variantClasses[variant], className)}
      {...props}
    >
      {children}
    </div>
  )
}
