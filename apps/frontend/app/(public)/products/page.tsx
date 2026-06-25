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
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold text-text">Produk</h1>
      <p className="mb-6 text-sm text-text-sub">Jelajahi produk dari berbagai toko terpercaya.</p>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex w-full max-w-md gap-2">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Cari produk..."
            className="flex-1"
          />
          <button
            type="submit"
            aria-label="Cari"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-dark"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>

        <select
          value={sort}
          onChange={(event) => updateParams({ sort: event.target.value, page: undefined })}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary"
        >
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} height={220} />
          ))}
        </div>
      ) : !products || products.length === 0 ? (
        <EmptyState
          icon={PackageX}
          title="Belum ada produk yang tersedia"
          description="Coba cari dengan kata kunci lain."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
  )
}
