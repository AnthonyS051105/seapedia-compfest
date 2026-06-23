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
        'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-10 text-center',
        className
      )}
    >
      {Icon && <Icon className="h-10 w-10 text-text-sub" />}
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      {description && <p className="text-sm text-text-sub">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
