import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'h-10 rounded-lg border border-border bg-surface px-3 text-base text-text outline-none transition-colors focus:border-primary',
            error && 'border-danger focus:border-danger',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : helperText ? (
          <p className="text-sm text-text-sub">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
