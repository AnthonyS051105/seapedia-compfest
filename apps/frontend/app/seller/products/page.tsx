'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Package, Plus, Pencil, Trash2, ImageOff } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { ApiErrorResponse, PaginatedResponse, SellerProduct } from '@/types'

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function StockLabel({ stock }: { stock: number }) {
  if (stock === 0) {
    return <span className="text-xs font-medium text-danger-600 dark:text-danger-500">Habis</span>
  }
  if (stock <= 10) {
    return <span className="text-xs font-medium text-amber-600 dark:text-amber-500">Menipis ({stock})</span>
  }
  return <span className="text-xs font-medium text-success-600 dark:text-success-500">{stock} tersedia</span>
}

export default function SellerProductsPage() {
  return (
    <Suspense>
      <SellerProductsPageContent />
    </Suspense>
  )
}

function SellerProductsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const [result, setResult] = useState<{
    key: number
    products: SellerProduct[]
    meta: { total: number; totalPages: number }
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SellerProduct | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let isCurrent = true

    api
      .get<PaginatedResponse<SellerProduct>>('/seller/products', { params: { page, limit: 10 } })
      .then((res) => {
        if (!isCurrent) return
        setResult({
          key: page,
          products: res.data.data,
          meta: { total: res.data.meta.total, totalPages: res.data.meta.totalPages },
        })
      })
      .catch(() => {
        if (!isCurrent) return
        setResult({ key: page, products: [], meta: { total: 0, totalPages: 0 } })
      })

    return () => {
      isCurrent = false
    }
  }, [page, refreshKey])

  const isLoading = result?.key !== page
  const products = isLoading ? null : result.products
  const meta = isLoading ? null : result.meta

  const updatePage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(nextPage))
    router.push(`/seller/products?${params.toString()}`)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await api.delete(`/seller/products/${deleteTarget.id}`)
      toast.success('Produk berhasil dihapus')
      setDeleteTarget(null)
      setRefreshKey((k) => k + 1)
    } catch (error) {
      const apiErr = error as { response?: { data?: ApiErrorResponse } }
      toast.error(apiErr.response?.data?.message ?? 'Gagal menghapus produk')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">Produk Saya</h1>
        <Link href="/seller/products/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Tambah Produk
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <Skeleton height={400} className="rounded-xl" />
      ) : !products || products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Belum ada produk"
          description="Mulai jual produk pertamamu di SEAPEDIA."
          action={
            <Link href="/seller/products/new">
              <Button size="sm">Buat Produk Pertama</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-left">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Produk
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Harga</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Stok</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                          {product.images[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <ImageOff className="h-5 w-5 text-zinc-400" />
                          )}
                        </div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{product.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                      {formatRupiah(product.price)}
                    </td>
                    <td className="px-4 py-3">
                      <StockLabel stock={product.stock} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/seller/products/${product.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(product)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 && (
            <Pagination page={page} totalPages={meta.totalPages} onPageChange={updatePage} className="mt-6" />
          )}
        </>
      )}

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Produk?">
        <p className="text-sm text-zinc-500">
          Produk <span className="font-medium text-zinc-900 dark:text-zinc-100">{deleteTarget?.name}</span> akan
          dihapus dan tidak akan tampil lagi di katalog. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
            Batal
          </Button>
          <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
            Hapus
          </Button>
        </div>
      </Modal>
    </div>
  )
}
