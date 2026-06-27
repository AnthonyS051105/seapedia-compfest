import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type CardVariant = 'default' | 'hover' | 'interactive' | 'selected' | 'elevated' | 'dark'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  children: ReactNode
}

const variantClasses: Record<CardVariant, string> = {
  default: 'rounded-xl border border-zinc-200 bg-white [box-shadow:var(--shadow-card)] dark:border-zinc-800 dark:bg-zinc-900',
  hover: 'rounded-xl border border-zinc-200 bg-white [box-shadow:var(--shadow-card)] card-interactive dark:border-zinc-800 dark:bg-zinc-900',
  interactive: 'rounded-xl border border-zinc-200 bg-white [box-shadow:var(--shadow-card)] card-interactive dark:border-zinc-800 dark:bg-zinc-900',
  selected: 'rounded-xl border border-brand-500 bg-white ring-1 ring-brand-500 [box-shadow:var(--shadow-card)] dark:bg-zinc-900',
  elevated: 'rounded-2xl border border-zinc-100 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900',
  dark: 'rounded-xl border border-zinc-800 bg-zinc-900',
}

export function Card({ variant = 'default', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('p-4', variantClasses[variant], className)}
      {...props}
    >
      {children}
    </div>
  )
}
