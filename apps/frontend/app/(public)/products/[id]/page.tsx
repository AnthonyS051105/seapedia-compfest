'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ImageOff, Minus, Plus, Store as StoreIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { useCartStore } from '@/store/cart.store'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Reveal, RevealItem } from '@/components/ui/Reveal'
import { TiltCard } from '@/components/ui/TiltCard'
import { Magnetic } from '@/components/ui/Magnetic'
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
  const [activeTab, setActiveTab] = useState<'description'>('description')

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
      <div className="container-page flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">Produk tidak ditemukan</h1>
        <p className="text-zinc-500">Produk ini mungkin sudah dihapus atau tidak tersedia.</p>
        <Link href="/products" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          Kembali ke katalog
        </Link>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container-page py-8">
        <div className="grid gap-10 pt-8 lg:grid-cols-[3fr_2fr]">
          <Skeleton height={400} className="rounded-2xl" />
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
      toast.success('Produk ditambahkan ke keranjang')
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
      toast.success('Produk ditambahkan ke keranjang')
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
    <div className="container-page py-8">
      <nav className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="hover:text-brand-600 dark:hover:text-brand-400">
          Beranda
        </Link>{' '}
        &gt;{' '}
        <Link href="/products" className="hover:text-brand-600 dark:hover:text-brand-400">
          Produk
        </Link>{' '}
        &gt; <span className="text-zinc-700 dark:text-zinc-300">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
        <Reveal y={16} className="lg:sticky lg:top-24 lg:self-start">
          <TiltCard maxTilt={5} radiusClassName="rounded-2xl" className="group aspect-square overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            {product.images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[activeImage]}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageOff className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
              </div>
            )}
          </TiltCard>

          {product.images.length > 1 && (
            <Reveal stagger staggerGap={0.05} className="mt-3 flex gap-2">
              {product.images.map((image, index) => (
                <RevealItem key={image} y={8}>
                  <button
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={cn(
                      'h-16 w-16 overflow-hidden rounded-lg border-2 transition-colors',
                      index === activeImage ? 'border-brand-500' : 'border-zinc-200 dark:border-zinc-700'
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  </button>
                </RevealItem>
              ))}
            </Reveal>
          )}
        </Reveal>

        <Reveal delay={0.1} y={16}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
            {product.store.name}
          </p>
          <h1 className="mb-2 font-display text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            {product.name}
          </h1>
          <p className="mb-1 font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">
            {formatRupiah(product.price)}
          </p>
          {isOutOfStock ? (
            <Badge variant="red">Stok Habis</Badge>
          ) : (
            <p className="text-sm text-zinc-500">Stok: {product.stock} tersisa</p>
          )}

          <div className="my-5 h-px bg-zinc-100 dark:bg-zinc-800" />

          <div className="flex items-center gap-3">
            {!isOutOfStock && (
              <div className="flex overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  aria-label="Kurangi jumlah"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center border-r border-zinc-200 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="flex h-10 w-10 items-center justify-center text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Tambah jumlah"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="flex h-10 w-10 items-center justify-center border-l border-zinc-200 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}

            {isAuthenticated ? (
              <Magnetic strength={0.2} className="flex-1">
                <Button
                  size="lg"
                  disabled={isOutOfStock}
                  isLoading={isAddingToCart}
                  onClick={handleAddToCart}
                  title={!isBuyer ? 'Aktifkan peran Pembeli' : undefined}
                  className="w-full"
                >
                  Tambah ke Keranjang
                </Button>
              </Magnetic>
            ) : (
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/auth/login')}
                className="flex-1"
              >
                Login untuk Berbelanja
              </Button>
            )}
          </div>

          <Link
            href={`/stores/${product.store.id}`}
            className="mt-6 flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:border-brand-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-brand-700"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
              <StoreIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{product.store.name}</p>
            </div>
            <span className="text-sm text-brand-600 dark:text-brand-400">Lihat Toko →</span>
          </Link>

          <div className="mt-6">
            <div className="flex border-b border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab('description')}
                className={cn(
                  '-mb-px border-b-2 px-1 py-2 text-sm transition-colors',
                  activeTab === 'description'
                    ? 'border-brand-500 font-medium text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                )}
              >
                Deskripsi
              </button>
            </div>
            <div className="prose pt-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              <p className="whitespace-pre-line">{product.description || 'Tidak ada deskripsi untuk produk ini.'}</p>
            </div>
          </div>
        </Reveal>
      </div>

      <Modal isOpen={!!conflict} onClose={() => setConflict(null)} title="Produk dari Toko Berbeda">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Keranjangmu saat ini berisi produk dari{' '}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            &quot;{conflict?.current_store.name}&quot;
          </span>
          . SEAPEDIA hanya mengizinkan pembelian dari 1 toko dalam 1 pesanan.
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Apakah kamu ingin mengosongkan keranjang dan menambahkan produk dari{' '}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            &quot;{conflict?.requested_store.name}&quot;
          </span>{' '}
          ini?
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
