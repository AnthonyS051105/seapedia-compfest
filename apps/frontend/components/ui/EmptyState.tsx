import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 p-10 text-center',
        className
      )}
    >
      {Icon && <Icon className="w-10 h-10 text-zinc-300 mx-auto mb-4" />}
      <h3 className="font-display text-base font-semibold text-zinc-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-zinc-500 mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}
