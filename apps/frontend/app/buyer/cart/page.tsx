'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Minus, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useCartStore } from '@/store/cart.store'
import { ApiErrorResponse, ApiResponse, CartSummary } from '@/types'

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

export default function BuyerCartPage() {
  const router = useRouter()
  const setItemCount = useCartStore((state) => state.setItemCount)

  const [cart, setCart] = useState<CartSummary | null | undefined>(undefined)
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null)
  const [removingItemId, setRemovingItemId] = useState<string | null>(null)

  const fetchCart = () => {
    api
      .get<ApiResponse<CartSummary>>('/buyer/cart')
      .then((res) => {
        setCart(res.data.data)
        setItemCount(res.data.data.items.length)
      })
      .catch(() => setCart(null))
  }

  useEffect(() => {
    fetchCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return
    setUpdatingItemId(itemId)
    try {
      const { data } = await api.put<ApiResponse<CartSummary>>(`/buyer/cart/${itemId}`, { quantity })
      setCart(data.data)
      setItemCount(data.data.items.length)
    } catch (error) {
      const apiErr = error as { response?: { data?: ApiErrorResponse } }
      toast.error(apiErr.response?.data?.message ?? 'Gagal memperbarui jumlah')
    } finally {
      setUpdatingItemId(null)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    setRemovingItemId(itemId)
    try {
      const { data } = await api.delete<ApiResponse<CartSummary>>(`/buyer/cart/${itemId}`)
      setCart(data.data)
      setItemCount(data.data.items.length)
      toast.success('Item berhasil dihapus dari keranjang')
    } catch (error) {
      const apiErr = error as { response?: { data?: ApiErrorResponse } }
      toast.error(apiErr.response?.data?.message ?? 'Gagal menghapus item')
    } finally {
      setRemovingItemId(null)
    }
  }

  if (cart === undefined) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">Keranjang Belanja</h1>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={96} />
          ))}
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">Keranjang Belanja</h1>
        <EmptyState
          icon={ShoppingCart}
          title="Keranjangmu kosong"
          description="Yuk mulai belanja!"
          action={
            <Link href="/products">
              <Button>Mulai Belanja</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">Keranjang Belanja</h1>

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-sm text-amber-800 dark:text-amber-300">
          Kamu hanya bisa membeli dari 1 toko dalam 1 pesanan
        </p>
      </div>

      {cart.store && (
        <p className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Dari: {cart.store.name}</p>
      )}

      <div>
        {cart.items.map((item) => (
          <div
            key={item.id}
            className="mb-3 flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <Package className="h-6 w-6 text-zinc-300 dark:text-zinc-700" />
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.product_name}</p>
              <p className="text-xs text-brand-600 dark:text-brand-400">{cart.store?.name}</p>
              <p className="text-xs text-zinc-500">{formatRupiah(item.product_price)} / item</p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  aria-label="Kurangi jumlah"
                  disabled={updatingItemId === item.id || item.quantity <= 1}
                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                  className="flex h-8 w-8 items-center justify-center border-r border-zinc-200 text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="flex h-8 w-8 items-center justify-center text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  aria-label="Tambah jumlah"
                  disabled={updatingItemId === item.id || item.quantity >= item.product_stock}
                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                  className="flex h-8 w-8 items-center justify-center border-l border-zinc-200 text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{formatRupiah(item.subtotal)}</p>

              <button
                type="button"
                aria-label="Hapus item"
                disabled={removingItemId === item.id}
                onClick={() => handleRemoveItem(item.id)}
                className="text-zinc-400 hover:text-danger-500 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 ml-auto max-w-sm rounded-xl border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Subtotal ({cart.items.length} produk)</p>
          <p className="font-bold text-zinc-900 dark:text-zinc-100">{formatRupiah(cart.subtotal)}</p>
        </div>
        <Button size="lg" className="mt-3 w-full" onClick={() => router.push('/buyer/checkout')}>
          Lanjut ke Checkout
        </Button>
      </div>
    </div>
  )
}
