'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Package, Plus, Pencil, Trash2, ImageOff } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { ApiErrorResponse, PaginatedResponse, SellerProduct } from '@/types'

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
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
        <h1 className="text-2xl font-bold text-text">Produk Saya</h1>
        <Link href="/seller/products/new">
          <Button>
            <Plus className="h-4 w-4" />
            Tambah Produk
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={88} />
          ))}
        </div>
      ) : !products || products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Belum ada produk"
          description="Mulai jual produk pertamamu di SEAPEDIA."
          action={
            <Link href="/seller/products/new">
              <Button>Buat Produk Pertama</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {products.map((product) => (
              <Card key={product.id} className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <ImageOff className="h-6 w-6 text-text-sub" />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-text">{product.name}</h3>
                  <p className="text-sm text-text-sub">{formatRupiah(product.price)}</p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <Badge variant={product.stock > 0 ? 'green' : 'red'}>
                    {product.stock > 0 ? `Stok: ${product.stock}` : 'Stok Habis'}
                  </Badge>
                </div>

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
              </Card>
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <Pagination page={page} totalPages={meta.totalPages} onPageChange={updatePage} className="mt-6" />
          )}
        </>
      )}

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Produk?">
        <p className="text-sm text-text-sub">
          Produk <span className="font-medium text-text">{deleteTarget?.name}</span> akan dihapus dan tidak
          akan tampil lagi di katalog. Tindakan ini tidak dapat dibatalkan.
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
