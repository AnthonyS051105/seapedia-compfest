import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

function getPageNumbers(page: number, totalPages: number): number[] {
  const range = 2
  const start = Math.max(1, page - range)
  const end = Math.min(totalPages, page + range)
  const pages: number[] = []
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  const pages = getPageNumbers(page, totalPages)

  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      <button
        type="button"
        aria-label="Halaman sebelumnya"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages[0] > 1 && <span className="px-2 text-text-sub">…</span>}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium',
            p === page ? 'bg-primary text-white' : 'text-text hover:bg-gray-50'
          )}
        >
          {p}
        </button>
      ))}

      {pages[pages.length - 1] < totalPages && <span className="px-2 text-text-sub">…</span>}

      <button
        type="button"
        aria-label="Halaman selanjutnya"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
