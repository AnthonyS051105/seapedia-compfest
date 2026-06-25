'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ImageOff, Minus, Plus, Store as StoreIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { useCartStore } from '@/store/cart.store'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiErrorResponse, ApiResponse, CartConflictData, Product } from '@/types'

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { isAuthenticated, activeRole } = useAuthStore()
  const refreshItemCount = useCartStore((state) => state.refreshItemCount)

  const [product, setProduct] = useState<Product | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [conflict, setConflict] = useState<CartConflictData | null>(null)
  const [isResolvingConflict, setIsResolvingConflict] = useState(false)

  useEffect(() => {
    api
      .get<ApiResponse<Product>>(`/products/${params.id}`)
      .then((res) => {
        setProduct(res.data.data)
        setQuantity(1)
        setActiveImage(0)
      })
      .catch(() => setNotFound(true))
  }, [params.id])

  if (notFound) {
    return (
      <div className="mx-auto flex max-w-[1400px] flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-text">Produk tidak ditemukan</h1>
        <p className="text-text-sub">Produk ini mungkin sudah dihapus atau tidak tersedia.</p>
        <Link href="/products" className="font-medium text-primary hover:underline">
          Kembali ke katalog
        </Link>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Skeleton height={400} />
          <div className="flex flex-col gap-4">
            <Skeleton height={32} width="80%" />
            <Skeleton height={24} width="40%" />
            <Skeleton height={120} />
          </div>
        </div>
      </div>
    )
  }

  const isOutOfStock = product.stock <= 0
  const isBuyer = activeRole === 'BUYER'

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (!isBuyer) {
      toast.error('Aktifkan peran Pembeli untuk menambahkan ke keranjang')
      return
    }

    setIsAddingToCart(true)
    try {
      await api.post('/buyer/cart', { product_id: product.id, quantity })
      toast.success('Produk ditambahkan ke keranjang 🛒')
      refreshItemCount()
    } catch (error) {
      const apiErr = error as {
        response?: { status?: number; data?: ApiErrorResponse & { data?: CartConflictData } }
      }
      if (apiErr.response?.status === 409 && apiErr.response.data?.data) {
        setConflict(apiErr.response.data.data)
      } else {
        toast.error(apiErr.response?.data?.message ?? 'Gagal menambahkan ke keranjang')
      }
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleClearCartAndRetry = async () => {
    if (!product) return
    setIsResolvingConflict(true)
    try {
      await api.delete('/buyer/cart')
      await api.post('/buyer/cart', { product_id: product.id, quantity })
      toast.success('Produk ditambahkan ke keranjang 🛒')
      refreshItemCount()
      setConflict(null)
    } catch (error) {
      const apiErr = error as { response?: { data?: ApiErrorResponse } }
      toast.error(apiErr.response?.data?.message ?? 'Gagal menambahkan ke keranjang')
    } finally {
      setIsResolvingConflict(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <nav className="mb-6 text-sm text-text-sub">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>{' '}
        &gt;{' '}
        <Link href="/products" className="hover:text-primary">
          Produk
        </Link>{' '}
        &gt; <span className="text-text">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-gray-100">
            {product.images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <ImageOff className="h-12 w-12 text-text-sub" />
            )}
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${
                    index === activeImage ? 'border-primary' : 'border-border'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text">{product.name}</h1>
            <p className="mt-2 text-2xl font-bold text-primary">{formatRupiah(product.price)}</p>
            <p className="mt-1 text-sm text-text-sub">
              {isOutOfStock ? <Badge variant="red">Stok habis</Badge> : `Stok: ${product.stock} tersisa`}
            </p>
          </div>

          {!isOutOfStock && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-text">Kuantitas:</span>
              <div className="flex items-center rounded-lg border border-border">
                <button
                  type="button"
                  aria-label="Kurangi jumlah"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-9 w-9 items-center justify-center text-text hover:bg-gray-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-medium text-text">{quantity}</span>
                <button
                  type="button"
                  aria-label="Tambah jumlah"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="flex h-9 w-9 items-center justify-center text-text hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <Button
            size="lg"
            disabled={isOutOfStock}
            isLoading={isAddingToCart}
            onClick={handleAddToCart}
            title={isAuthenticated && !isBuyer ? 'Aktifkan peran Pembeli' : undefined}
            className="w-full sm:w-auto"
          >
            Tambah ke Keranjang
          </Button>

          <Link
            href={`/stores/${product.store.id}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 hover:border-primary"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <StoreIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-text-sub">Toko</p>
              <p className="font-medium text-text">{product.store.name}</p>
            </div>
            <span className="text-sm text-primary">Lihat Toko →</span>
          </Link>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h2 className="mb-2 font-semibold text-text">Deskripsi</h2>
            <p className="whitespace-pre-line text-sm text-text-sub">
              {product.description || 'Tidak ada deskripsi untuk produk ini.'}
            </p>
          </div>
        </div>
      </div>

      <Modal isOpen={!!conflict} onClose={() => setConflict(null)} title="⚠️ Produk dari Toko Berbeda">
        <p className="text-sm text-text-sub">
          Keranjangmu saat ini berisi produk dari{' '}
          <span className="font-medium text-text">&quot;{conflict?.current_store.name}&quot;</span>. SEAPEDIA hanya
          mengizinkan pembelian dari 1 toko dalam 1 pesanan.
        </p>
        <p className="mt-2 text-sm text-text-sub">
          Apakah kamu ingin mengosongkan keranjang dan menambahkan produk dari{' '}
          <span className="font-medium text-text">&quot;{conflict?.requested_store.name}&quot;</span> ini?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConflict(null)} disabled={isResolvingConflict}>
            Batal
          </Button>
          <Button onClick={handleClearCartAndRetry} isLoading={isResolvingConflict}>
            Ya, Kosongkan
          </Button>
        </div>
      </Modal>
    </div>
  )
}
