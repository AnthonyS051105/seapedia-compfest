'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, PackageX } from 'lucide-react'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { ProductCard } from '@/components/public/ProductCard'
import { PaginatedResponse, Product } from '@/types'

type SortOption = 'newest' | 'price_asc' | 'price_desc'

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Terbaru',
  price_asc: 'Harga Terendah',
  price_desc: 'Harga Tertinggi',
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsPageContent />
    </Suspense>
  )
}

function ProductsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get('page') ?? '1')
  const sort = (searchParams.get('sort') as SortOption) || 'newest'
  const search = searchParams.get('search') ?? ''

  const [searchInput, setSearchInput] = useState(search)
  const requestKey = `${page}|${sort}|${search}`
  const [result, setResult] = useState<{
    key: string
    products: Product[]
    meta: { total: number; totalPages: number }
  } | null>(null)

  useEffect(() => {
    let isCurrent = true

    api
      .get<PaginatedResponse<Product>>('/products', {
        params: { page, limit: 12, sort, search: search || undefined },
      })
      .then((res) => {
        if (!isCurrent) return
        setResult({
          key: requestKey,
          products: res.data.data,
          meta: { total: res.data.meta.total, totalPages: res.data.meta.totalPages },
        })
      })
      .catch(() => {
        if (!isCurrent) return
        setResult({ key: requestKey, products: [], meta: { total: 0, totalPages: 0 } })
      })

    return () => {
      isCurrent = false
    }
  }, [page, sort, search, requestKey])

  const isLoading = result?.key !== requestKey
  const products = isLoading ? null : result.products
  const meta = isLoading ? null : result.meta

  const updateParams = (next: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })
    router.push(`/products?${params.toString()}`)
  }

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    updateParams({ search: searchInput, page: undefined })
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="container-page pt-8 pb-4">
        <h1 className="font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">Semua Produk</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {meta ? `${meta.total} produk ditemukan` : 'Menjelajahi katalog produk'}
        </p>
      </div>

      <div className="sticky top-16 z-30 border-b border-zinc-100 bg-white/95 py-3 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="container-page flex items-center justify-center gap-3 md:pl-32">
          <form onSubmit={handleSearchSubmit} className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari produk..."
              className="pl-9"
            />
          </form>

          <select
            value={sort}
            onChange={(event) => updateParams({ sort: event.target.value, page: undefined })}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="container-page mt-6 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} height={220} />
            ))}
          </div>
        ) : !products || products.length === 0 ? (
          <div className="flex justify-center pt-20 pb-16">
            <EmptyState
              icon={PackageX}
              title="Belum ada produk yang tersedia"
              description="Coba cari dengan kata kunci lain."
              className="max-w-md"
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {meta && meta.totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={meta.totalPages}
                onPageChange={(nextPage) => updateParams({ page: nextPage })}
                className="mt-8"
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
