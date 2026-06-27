'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { Reveal, RevealItem } from '@/components/ui/Reveal'
import { TiltCard } from '@/components/ui/TiltCard'
import { Magnetic } from '@/components/ui/Magnetic'
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

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 font-display font-semibold text-zinc-950 dark:text-zinc-50">
      <span className="text-sm font-bold text-brand-500">{number}</span>
      {title}
    </h2>
  )
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
        const message = apiErr.response?.data?.message ?? 'Gagal memuat ringkasan harga'

        // If the discount code is the cause, fall back to a no-discount preview
        // so the rest of checkout (address/delivery/total) stays usable while
        // the error is surfaced next to the discount input.
        if (appliedDiscountCode) {
          setPreviewError(message)
          api
            .post<ApiResponse<CheckoutPreview>>('/buyer/checkout/preview', {
              address_id: addressId,
              delivery_method: deliveryMethod,
            })
            .then((fallbackRes) => {
              if (!isCurrent) return
              setPreview(fallbackRes.data.data)
            })
            .catch(() => {
              if (!isCurrent) return
              setPreview(null)
            })
          return
        }

        setPreview(null)
        setPreviewError(message)
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
      toast.success('Pesanan berhasil dibuat!')
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
      <div className="mx-auto max-w-4xl">
        <Skeleton height={400} />
      </div>
    )
  }

  if (!addresses || addresses.length === 0) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-zinc-500">Kamu belum memiliki alamat pengiriman.</p>
        <Link href="/buyer/addresses">
          <Button className="mt-4">Tambah Alamat</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Reveal>
        <h1 className="mb-6 font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">Checkout</h1>
      </Reveal>

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <Reveal delay={0.05}>
          <div>
            <SectionHeader number={1} title="Alamat Pengiriman" />
            <Reveal stagger staggerGap={0.05} className="flex flex-col gap-2">
              {addresses.map((address) => (
                <RevealItem key={address.id}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all',
                      addressId === address.id
                        ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20 dark:bg-brand-500/10'
                        : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
                    )}
                  >
                    <input
                      type="radio"
                      name="address"
                      className="mt-1 accent-brand-500"
                      checked={addressId === address.id}
                      onChange={() => setAddressId(address.id)}
                    />
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {address.label} - {address.recipient_name}, {address.phone}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {address.street}, {address.city}, {address.province} {address.postal_code}
                      </p>
                    </div>
                  </label>
                </RevealItem>
              ))}
            </Reveal>

            <div className="mt-6">
              <SectionHeader number={2} title="Metode Pengiriman" />
              <div className="flex flex-col gap-2">
                {DELIVERY_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all',
                      deliveryMethod === option.value
                        ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20 dark:bg-brand-500/10'
                        : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="delivery_method"
                        className="accent-brand-500"
                        checked={deliveryMethod === option.value}
                        onChange={() => setDeliveryMethod(option.value)}
                      />
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{option.label}</p>
                        <p className="text-xs text-zinc-500">{option.sla}</p>
                      </div>
                    </div>
                    <p className="font-bold text-brand-600 dark:text-brand-400">{formatRupiah(option.fee)}</p>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <SectionHeader number={3} title="Kode Diskon (Opsional)" />
              <div className="flex gap-2">
                <Input
                  placeholder="HEMAT10"
                  value={discountCodeInput}
                  onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleApplyDiscount}>
                  Gunakan
                </Button>
              </div>
              {preview?.discount_code && !previewError && (
                <div className="mt-2 flex justify-between rounded-lg border border-success-200 bg-success-50 px-3 py-2 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
                  <span>
                    {preview.discount_type === 'VOUCHER' ? 'Voucher' : 'Promo'} {preview.discount_code} diterapkan
                  </span>
                  <span className="font-semibold">-{formatRupiah(preview.discount_amount)}</span>
                </div>
              )}
              {previewError && appliedDiscountCode && (
                <p className="mt-2 text-sm text-danger-600 dark:text-danger-500">{previewError}</p>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="lg:sticky lg:top-24 lg:self-start">
          <TiltCard radiusClassName="rounded-2xl">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-md dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 font-display font-semibold text-zinc-950 dark:text-zinc-50">Ringkasan Pesanan</h2>

              {preview === undefined ? (
                <Skeleton height={160} />
              ) : !preview ? (
                <p className="text-sm text-danger-600 dark:text-danger-500">{previewError}</p>
              ) : (
                <>
                  <div className="flex flex-col">
                    <div className="flex justify-between py-1.5 text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">Subtotal</span>
                      <span className="text-zinc-900 dark:text-zinc-100">{formatRupiah(preview.subtotal)}</span>
                    </div>
                    {preview.discount_amount > 0 && (
                      <div className="flex justify-between py-1.5 text-sm">
                        <span className="text-success-600 dark:text-success-500">
                          Diskon {preview.discount_code ? `(${preview.discount_code})` : ''}
                        </span>
                        <span className="text-success-600 dark:text-success-500">
                          -{formatRupiah(preview.discount_amount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-1.5 text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">Ongkos Kirim</span>
                      <span className="text-zinc-900 dark:text-zinc-100">{formatRupiah(preview.delivery_fee)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">PPN 12%</span>
                      <span className="text-zinc-900 dark:text-zinc-100">{formatRupiah(preview.ppn_amount)}</span>
                    </div>
                  </div>

                  <div className="my-3 h-px bg-zinc-100 dark:bg-zinc-800" />

                  <div className="flex justify-between font-display text-lg font-bold text-zinc-950 dark:text-zinc-50">
                    <span>Total Pembayaran</span>
                    <span>{formatRupiah(preview.final_total)}</span>
                  </div>

                  <p
                    className={cn(
                      'mt-2 text-xs',
                      preview.is_balance_enough ? 'text-zinc-500' : 'text-danger-600 dark:text-danger-500'
                    )}
                  >
                    Saldo dompet: {formatRupiah(preview.wallet_balance)}{' '}
                    {preview.is_balance_enough ? '' : '(Saldo tidak mencukupi)'}
                  </p>

                  <Magnetic className="mt-4 block">
                    <Button
                      size="lg"
                      className="w-full"
                      disabled={!preview.is_balance_enough}
                      isLoading={isConfirming}
                      onClick={handleConfirm}
                    >
                      Konfirmasi Pesanan
                    </Button>
                  </Magnetic>
                </>
              )}
            </div>
          </TiltCard>
        </Reveal>
      </div>
    </div>
  )
}
