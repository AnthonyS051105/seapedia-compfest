'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
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
        <h1 className="mb-6 text-2xl font-bold text-text">Keranjang Belanja</h1>
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
        <h1 className="mb-6 text-2xl font-bold text-text">Keranjang Belanja</h1>
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
      <h1 className="mb-4 text-2xl font-bold text-text">Keranjang Belanja</h1>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          Kamu hanya bisa membeli dari 1 toko dalam 1 pesanan. Kosongkan keranjang untuk berbelanja dari toko lain.
        </p>
      </div>

      {cart.store && (
        <p className="mb-3 text-sm font-medium text-text-sub">🏪 {cart.store.name}</p>
      )}

      <div className="flex flex-col gap-3">
        {cart.items.map((item) => (
          <Card key={item.id}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-text">{item.product_name}</p>
                <p className="text-sm text-text-sub">{formatRupiah(item.product_price)}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Kurangi jumlah"
                  disabled={updatingItemId === item.id || item.quantity <= 1}
                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center font-medium text-text">{item.quantity}</span>
                <button
                  type="button"
                  aria-label="Tambah jumlah"
                  disabled={updatingItemId === item.id || item.quantity >= item.product_stock}
                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="w-28 text-right font-semibold text-text">{formatRupiah(item.subtotal)}</p>

              <button
                type="button"
                aria-label="Hapus item"
                disabled={removingItemId === item.id}
                onClick={() => handleRemoveItem(item.id)}
                className="rounded-full p-1.5 text-text-sub hover:bg-gray-100 hover:text-danger disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-text-sub">Subtotal ({cart.items.length} produk)</p>
          <p className="text-lg font-bold text-text">{formatRupiah(cart.subtotal)}</p>
        </div>
        <Button className="mt-4 w-full" onClick={() => router.push('/buyer/checkout')}>
          Lanjut ke Checkout
        </Button>
      </Card>
    </div>
  )
}
