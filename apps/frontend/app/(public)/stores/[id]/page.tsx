'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Store as StoreIcon, PackageX } from 'lucide-react'
import { api } from '@/lib/api'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { ProductCard } from '@/components/public/ProductCard'
import { ApiResponse, StoreDetail } from '@/types'

export default function StoreDetailPage() {
  return (
    <Suspense>
      <StoreDetailPageContent />
    </Suspense>
  )
}

function StoreDetailPageContent() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const [store, setStore] = useState<StoreDetail | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    api
      .get<ApiResponse<StoreDetail>>(`/stores/${params.id}`, { params: { page, limit: 12 } })
      .then((res) => setStore(res.data.data))
      .catch(() => setNotFound(true))
  }, [params.id, page])

  if (notFound) {
    return (
      <div className="mx-auto flex max-w-[1400px] flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-text">Toko tidak ditemukan</h1>
        <Link href="/products" className="font-medium text-primary hover:underline">
          Kembali ke katalog
        </Link>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <Skeleton height={120} className="mb-6" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height={220} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-6 text-center sm:flex-row sm:text-left">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
          {store.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover" />
          ) : (
            <StoreIcon className="h-8 w-8 text-primary" />
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">{store.name}</h1>
          {store.address && <p className="text-sm text-text-sub">{store.address}</p>}
          {store.description && <p className="mt-1 text-sm text-text-sub">{store.description}</p>}
        </div>
      </div>

      <h2 className="mb-4 font-semibold text-text">Produk dari {store.name}</h2>

      {store.products.length === 0 ? (
        <EmptyState icon={PackageX} title="Toko ini belum memiliki produk" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {store.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {store.products_meta.totalPages > 1 && (
            <Pagination
              page={store.products_meta.page}
              totalPages={store.products_meta.totalPages}
              onPageChange={(nextPage) => router.push(`/stores/${params.id}?page=${nextPage}`)}
              className="mt-8"
            />
          )}
        </>
      )}
    </div>
  )
}
