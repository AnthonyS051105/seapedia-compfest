'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: number
  className?: string
}

export function StarRating({ value, onChange, size = 20, className }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const isInteractive = Boolean(onChange)
  const displayValue = hoverValue ?? value

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!isInteractive}
          aria-label={`${star} bintang`}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => isInteractive && setHoverValue(star)}
          onMouseLeave={() => isInteractive && setHoverValue(null)}
          className={cn('disabled:cursor-default', isInteractive && 'cursor-pointer')}
        >
          <Star
            width={size}
            height={size}
            className={star <= displayValue ? 'fill-accent-400 text-accent-400' : 'fill-none text-zinc-200 dark:text-zinc-700'}
          />
        </button>
      ))}
    </div>
  )
}
