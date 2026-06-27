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
      <div className="flex flex-col">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-zinc-700 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full border-[1.5px] border-zinc-300 rounded-lg px-3 py-2 text-sm bg-white text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 focus:outline-none',
            error && 'border-danger-500 ring-2 ring-danger-500/15',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-danger-600 mt-1.5">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-zinc-500 mt-1.5">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
