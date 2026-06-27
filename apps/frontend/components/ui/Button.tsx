import { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'dark-outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  children: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow-[var(--shadow-brand)] font-semibold',
  secondary: 'bg-zinc-900 hover:bg-zinc-800 text-white font-semibold',
  outline:
    'border border-zinc-300 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 bg-white font-medium',
  ghost: 'text-brand-600 hover:bg-brand-50 font-medium',
  danger: 'bg-danger-500 hover:bg-danger-700 text-white font-semibold',
  'dark-outline': 'border border-zinc-700 text-white hover:border-zinc-500 hover:bg-zinc-800 font-medium',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

const spinnerSize: Record<ButtonSize, 'sm' | 'md'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner size={spinnerSize[size]} className="text-current" />}
      {children}
    </button>
  )
}
