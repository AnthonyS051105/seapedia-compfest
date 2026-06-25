'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCartStore } from '@/store/cart.store'
import {
  ApiErrorResponse,
  ApiResponse,
  CheckoutPreview,
  DeliveryAddress,
  DeliveryMethod,
} from '@/types'

const DELIVERY_OPTIONS: { value: DeliveryMethod; label: string; fee: number; sla: string }[] = [
  { value: 'INSTANT', label: 'Instant', fee: 15000, sla: 'Sampai hari ini' },
  { value: 'NEXT_DAY', label: 'Next Day', fee: 10000, sla: 'Sampai besok' },
  { value: 'REGULAR', label: 'Regular', fee: 6000, sla: '1-3 hari kerja' },
]

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

export default function BuyerCheckoutPage() {
  const router = useRouter()
  const refreshItemCount = useCartStore((state) => state.refreshItemCount)

  const [addresses, setAddresses] = useState<DeliveryAddress[] | null | undefined>(undefined)
  const [addressId, setAddressId] = useState<string>('')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('REGULAR')
  const [discountCodeInput, setDiscountCodeInput] = useState('')
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<string | undefined>(undefined)

  const [preview, setPreview] = useState<CheckoutPreview | null | undefined>(undefined)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    api
      .get<ApiResponse<DeliveryAddress[]>>('/buyer/addresses')
      .then((res) => {
        setAddresses(res.data.data)
        const defaultAddress = res.data.data.find((a) => a.is_default) ?? res.data.data[0]
        if (defaultAddress) {
          setAddressId(defaultAddress.id)
        }
      })
      .catch(() => setAddresses(null))
  }, [])

  useEffect(() => {
    if (!addressId) return

    let isCurrent = true
    setPreview(undefined)
    setPreviewError(null)

    api
      .post<ApiResponse<CheckoutPreview>>('/buyer/checkout/preview', {
        address_id: addressId,
        delivery_method: deliveryMethod,
        discount_code: appliedDiscountCode,
      })
      .then((res) => {
        if (!isCurrent) return
        setPreview(res.data.data)
      })
      .catch((error) => {
        if (!isCurrent) return
        const apiErr = error as { response?: { data?: ApiErrorResponse } }
        setPreview(null)
        setPreviewError(apiErr.response?.data?.message ?? 'Gagal memuat ringkasan harga')
      })

    return () => {
      isCurrent = false
    }
  }, [addressId, deliveryMethod, appliedDiscountCode])

  const handleApplyDiscount = () => {
    const code = discountCodeInput.trim()
    setAppliedDiscountCode(code.length > 0 ? code : undefined)
  }

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      const { data } = await api.post<ApiResponse<{ id: string }>>('/buyer/checkout', {
        address_id: addressId,
        delivery_method: deliveryMethod,
        discount_code: appliedDiscountCode,
      })
      toast.success('Pesanan berhasil dibuat! 🎉')
      refreshItemCount()
      router.push(`/buyer/orders/${data.data.id}`)
    } catch (error) {
      const apiErr = error as { response?: { data?: ApiErrorResponse } }
      toast.error(apiErr.response?.data?.message ?? 'Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsConfirming(false)
    }
  }

  if (addresses === undefined) {
    return (
      <div className="mx-auto max-w-2xl">
        <Skeleton height={400} />
      </div>
    )
  }

  if (!addresses || addresses.length === 0) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-text-sub">Kamu belum memiliki alamat pengiriman.</p>
        <Link href="/buyer/addresses">
          <Button className="mt-4">Tambah Alamat</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-text">Checkout</h1>

      <div className="flex flex-col gap-6">
        <Card>
          <h2 className="mb-4 font-semibold text-text">1. Alamat Pengiriman</h2>
          <div className="flex flex-col gap-2">
            {addresses.map((address) => (
              <label
                key={address.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                  addressId === address.id ? 'border-primary ring-1 ring-primary' : 'border-border'
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  className="mt-1"
                  checked={addressId === address.id}
                  onChange={() => setAddressId(address.id)}
                />
                <div>
                  <p className="font-medium text-text">
                    🏠 {address.label} — {address.recipient_name}, {address.phone}
                  </p>
                  <p className="text-sm text-text-sub">
                    {address.street}, {address.city}, {address.province} {address.postal_code}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-text">2. Metode Pengiriman</h2>
          <div className="flex flex-col gap-2">
            {DELIVERY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 ${
                  deliveryMethod === option.value ? 'border-primary ring-1 ring-primary' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="delivery_method"
                    checked={deliveryMethod === option.value}
                    onChange={() => setDeliveryMethod(option.value)}
                  />
                  <div>
                    <p className="font-medium text-text">{option.label}</p>
                    <p className="text-xs text-text-sub">{option.sla}</p>
                  </div>
                </div>
                <p className="font-medium text-text">{formatRupiah(option.fee)}</p>
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-text">3. Kode Diskon (Opsional)</h2>
          <div className="flex gap-2">
            <Input
              placeholder="HEMAT10"
              value={discountCodeInput}
              onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
              className="flex-1"
            />
            <Button variant="outline" onClick={handleApplyDiscount}>
              Gunakan
            </Button>
          </div>
          {preview?.discount_code && (
            <p className="mt-2 text-sm text-secondary">
              ✓ {preview.discount_type === 'VOUCHER' ? 'Voucher' : 'Promo'} {preview.discount_code} berhasil
              diterapkan (-{formatRupiah(preview.discount_amount)})
            </p>
          )}
          {previewError && appliedDiscountCode && (
            <p className="mt-2 text-sm text-danger">{previewError}</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-text">4. Ringkasan Pesanan</h2>

          {preview === undefined ? (
            <Skeleton height={160} />
          ) : !preview ? (
            <p className="text-sm text-danger">{previewError}</p>
          ) : (
            <>
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-text-sub">Subtotal</dt>
                  <dd className="text-text">{formatRupiah(preview.subtotal)}</dd>
                </div>
                {preview.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-text-sub">
                      Diskon {preview.discount_code ? `(${preview.discount_code})` : ''}
                    </dt>
                    <dd className="text-danger">-{formatRupiah(preview.discount_amount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-text-sub">Ongkos Kirim</dt>
                  <dd className="text-text">{formatRupiah(preview.delivery_fee)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-sub">PPN 12%</dt>
                  <dd className="text-text">{formatRupiah(preview.ppn_amount)}</dd>
                </div>
                <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
                  <dt className="text-text">Total Pembayaran</dt>
                  <dd className="text-text">{formatRupiah(preview.final_total)}</dd>
                </div>
              </dl>

              <p className={`mt-4 text-sm ${preview.is_balance_enough ? 'text-text-sub' : 'text-danger'}`}>
                Saldo dompet: {formatRupiah(preview.wallet_balance)}{' '}
                {preview.is_balance_enough ? '✓' : '— Saldo tidak mencukupi'}
              </p>

              <Button
                className="mt-4 w-full"
                disabled={!preview.is_balance_enough}
                isLoading={isConfirming}
                onClick={handleConfirm}
              >
                Konfirmasi Pesanan
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
