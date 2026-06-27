'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  ShieldCheck,
  Zap,
  RefreshCw,
  Users,
  Tag,
  Truck,
  Lock,
  BarChart2,
  MessageSquarePlus,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { StarRating } from '@/components/ui/StarRating'
import { useReveal } from '@/hooks/useReveal'
import { createResolver } from '@/lib/validation/resolver'
import { CreateReviewFormSchema, CreateReviewFormData } from '@/lib/validation/review.schema'
import { ApiErrorResponse, Review } from '@/types'

const TRUST_ITEMS = [
  { Icon: ShieldCheck, label: 'Pembayaran aman' },
  { Icon: Zap, label: 'Checkout instan' },
  { Icon: RefreshCw, label: 'Refund otomatis' },
  { Icon: Users, label: 'Multi peran' },
  { Icon: Tag, label: 'Voucher & promo' },
  { Icon: Truck, label: 'Lacak pengiriman' },
  { Icon: Lock, label: 'Akun terlindungi' },
  { Icon: BarChart2, label: 'Laporan real-time' },
]

const STATS = [
  { value: '4', label: 'Peran dalam satu akun', sub: 'Pembeli, penjual, kurir, admin' },
  { value: 'Rp 6rb', label: 'Ongkir mulai dari', sub: 'Pengiriman reguler' },
  { value: '12%', label: 'Pajak terhitung otomatis', sub: 'Tampil jelas di setiap struk' },
  { value: '80%', label: 'Bagian kurir dari ongkir', sub: 'Dibayar tiap pengiriman selesai' },
]

const CHECKOUT_BULLETS = [
  'Rincian harga lengkap sebelum bayar, tidak ada biaya tersembunyi',
  'Diskon dan ongkos kirim terhitung otomatis di keranjang',
  'Pajak ditampilkan jelas, bukan ditambahkan diam-diam saat checkout',
]

const ORDER_STATUS_STEPS = [
  { label: 'Pesanan dikemas', time: '09.12', done: true },
  { label: 'Menunggu kurir', time: '09.40', done: true },
  { label: 'Sedang diantar', time: '10.05', done: true },
  { label: 'Pesanan tiba', time: '', done: false },
]

const ORDER_STATUS_BULLETS = [
  'Setiap perubahan status tercatat dengan waktu pasti',
  'Notifikasi otomatis begitu kurir mengambil pesanan',
  'Dana dikembalikan otomatis jika pengiriman terlambat',
]

export default function LandingPage() {
  const [reviews, setReviews] = useState<Review[] | null>(null)

  const heroRef = useReveal<HTMLDivElement>()
  const bentoRef = useReveal<HTMLDivElement>()
  const statsRef = useReveal<HTMLDivElement>()
  const checkoutRef = useReveal<HTMLDivElement>()
  const orderStatusRef = useReveal<HTMLDivElement>()
  const reviewsRef = useReveal<HTMLDivElement>()

  useEffect(() => {
    api
      .get<{ data: Review[] }>('/reviews', { params: { limit: 6 } })
      .then((res) => setReviews(res.data.data))
      .catch(() => setReviews([]))
  }, [])

  const handleReviewSubmitted = (review: Review) => {
    setReviews((prev) => [review, ...(prev ?? [])])
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* SECTION 1: HERO */}
      <section className="relative overflow-hidden bg-zinc-50 pt-24 pb-20 transition-colors dark:bg-zinc-950">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-500/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 right-0 h-80 w-80 rounded-full bg-accent-300/15 blur-3xl dark:bg-accent-400/10"
        />

        <div ref={heroRef} className="container-page relative z-10 reveal grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h1 className="mb-6 font-display text-5xl font-extrabold leading-[1.08] tracking-tight text-zinc-950 lg:text-[56px] dark:text-zinc-50">
              Belanja, jual, dan kirim barang dalam satu aplikasi
            </h1>

            <p className="mb-8 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              Marketplace yang menghubungkan pembeli, penjual, dan kurir secara langsung,
              dengan harga dan status pesanan yang selalu bisa kamu lihat sendiri.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/products">
                <Button variant="primary" size="lg">
                  Mulai belanja
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="outline" size="lg">
                  Buka toko
                </Button>
              </Link>
            </div>
          </div>

          <HeroProductMockup />
        </div>
      </section>

      {/* SECTION 2: MARQUEE TRUST BAR */}
      <section className="overflow-hidden border-y border-zinc-200 bg-white py-5 transition-colors dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex">
          <div className="flex items-center gap-12 animate-marquee whitespace-nowrap">
            {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
              <span
                key={i}
                className="flex shrink-0 items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400"
              >
                <item.Icon className="h-4 w-4 text-brand-500" aria-hidden="true" />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: BENTO GRID */}
      <section className="bg-white py-20 transition-colors dark:bg-zinc-900">
        <div ref={bentoRef} className="container-page reveal">
          <div className="mb-12">
            <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              Satu akun, banyak peran
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Masuk sekali, beralih peran sesuai yang kamu butuhkan hari ini.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Card 1: Pembeli */}
            <div className="relative min-h-50 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 card-interactive md:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-2 font-display text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                Sebagai pembeli
              </h3>
              <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Lihat rincian harga lengkap sebelum membayar</li>
                <li>Voucher dan promo berlaku otomatis di keranjang</li>
                <li>Pantau pesanan sampai benar-benar tiba</li>
              </ul>
              <div className="absolute bottom-4 right-4 w-36 rounded-lg border border-zinc-200 bg-white p-3 text-left opacity-30 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                <div className="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                  <span>Subtotal</span>
                  <span>Rp 450rb</span>
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                  <span>Pajak</span>
                  <span>Rp 49rb</span>
                </div>
              </div>
            </div>

            {/* Card 2: Admin (dark, tall, always dark) */}
            <div className="overflow-hidden rounded-2xl bg-zinc-950 p-6 text-white card-interactive md:row-span-2">
              <h3 className="mb-2 font-display text-xl font-semibold text-white">Sebagai admin</h3>
              <p className="mb-3 text-sm text-zinc-400">Mengawasi seluruh aktivitas platform.</p>
              <ul className="space-y-1.5 text-sm text-zinc-400">
                <li>Pantau toko, pesanan, dan pengiriman</li>
                <li>Atur voucher dan promo yang berjalan</li>
                <li>Proses pengembalian dana yang tertunda</li>
              </ul>
            </div>

            {/* Card 3: Penjual (brand color, always brand) */}
            <div className="rounded-2xl bg-brand-500 p-6 text-white card-interactive">
              <h3 className="mb-2 font-display text-xl font-semibold text-white">Sebagai penjual</h3>
              <ul className="space-y-1.5 text-sm text-brand-100">
                <li>Kelola produk dan stok dari satu dasbor</li>
                <li>Proses pesanan sampai siap dikirim</li>
              </ul>
            </div>

            {/* Card 4: Kurir */}
            <div className="relative min-h-40 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-6 card-interactive md:col-span-2 dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="mb-2 font-display text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                Sebagai kurir
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Ambil pekerjaan pengiriman yang tersedia dan dapatkan bagian dari setiap ongkir.
              </p>
              <span className="absolute bottom-4 right-4 rounded-full bg-success-50 px-3 py-1 text-xs font-semibold text-success-700 dark:bg-success-500/10 dark:text-success-400">
                Rp 12.000
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: STATS (always dark, Linear-style impact moment) */}
      <section className="bg-zinc-950 py-20">
        <div ref={statsRef} className="container-page reveal grid grid-cols-2 gap-12 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="mb-2 font-display text-5xl font-extrabold text-white">{stat.value}</p>
              <p className="mb-1 text-sm font-semibold text-zinc-300">{stat.label}</p>
              <p className="text-xs text-zinc-500">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: FEATURE - CHECKOUT */}
      <section className="bg-white py-20 transition-colors dark:bg-zinc-900">
        <div ref={checkoutRef} className="container-page reveal grid items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              Checkout yang transparan
            </h2>
            <p className="mb-6 max-w-md text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Setiap angka di struk belanja bisa dijelaskan, dari subtotal sampai pajak.
            </p>
            <ul className="space-y-3">
              {CHECKOUT_BULLETS.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-float overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-1.5 border-b border-zinc-100 bg-zinc-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span className="ml-3 text-xs text-zinc-400 dark:text-zinc-500">app/checkout</span>
            </div>
            <div className="space-y-2 px-5 py-4">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Subtotal</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">Rp 450.000</span>
              </div>
              <div className="flex justify-between text-xs text-success-600 dark:text-success-500">
                <span>Diskon HEMAT10</span>
                <span>-Rp 45.000</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Ongkos kirim</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">Rp 6.000</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Pajak</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">Rp 49.320</span>
              </div>
              <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
              <div className="flex justify-between text-sm font-bold">
                <span className="text-zinc-950 dark:text-zinc-50">Total</span>
                <span className="text-zinc-950 dark:text-zinc-50">Rp 460.320</span>
              </div>
              <button
                type="button"
                disabled
                className="mt-3 w-full rounded-lg bg-brand-500 py-2 text-center text-xs font-semibold text-white"
              >
                Bayar sekarang
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: FEATURE - ORDER STATUS (reversed) */}
      <section className="bg-zinc-50 py-20 transition-colors dark:bg-zinc-950">
        <div ref={orderStatusRef} className="container-page reveal grid items-center gap-16 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm lg:order-1 dark:border-zinc-800 dark:bg-zinc-900">
            {ORDER_STATUS_STEPS.map((step, i) => (
              <div key={step.label}>
                <div className="flex items-center gap-3">
                  <span
                    className={`h-3 w-3 shrink-0 rounded-full ${
                      step.done ? 'bg-brand-500' : 'bg-zinc-200 dark:bg-zinc-700'
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      step.done
                        ? 'font-semibold text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-400 dark:text-zinc-600'
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.time && (
                    <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-500">{step.time}</span>
                  )}
                </div>
                {i < ORDER_STATUS_STEPS.length - 1 && (
                  <div className="ml-1.25 h-4 w-0.5 bg-zinc-200 dark:bg-zinc-700" />
                )}
              </div>
            ))}
          </div>

          <div className="lg:order-2">
            <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              Pantau pesanan secara langsung
            </h2>
            <p className="mb-6 max-w-md text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Status pesanan berubah sesuai urutan yang sebenarnya, tidak ada langkah yang dilewati.
            </p>
            <ul className="space-y-3">
              {ORDER_STATUS_BULLETS.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 7: REVIEWS */}
      <section className="bg-white py-20 transition-colors dark:bg-zinc-900">
        <div ref={reviewsRef} className="container-page reveal">
          <h2 className="mb-12 text-center font-display text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Apa kata pengguna?
          </h2>

          {reviews === null ? (
            <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height={120} className="mb-4 break-inside-avoid" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <EmptyState
              icon={MessageSquarePlus}
              title="Belum ada ulasan"
              description="Jadilah yang pertama membagikan pengalamanmu di bawah ini."
            />
          ) : (
            <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
              {reviews.map((review) => (
                <Card
                  key={review.id}
                  variant="interactive"
                  className="mb-4 break-inside-avoid !p-5"
                >
                  <StarRating value={review.rating} size={16} />
                  <p className="mb-3 mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{review.reviewer_name}</p>
                </Card>
              ))}
            </div>
          )}

          <div className="mx-auto mt-12 max-w-lg">
            <ReviewForm onSubmitted={handleReviewSubmitted} />
          </div>
        </div>
      </section>

      {/* SECTION 8: CTA BAND (always brand color) */}
      <section className="bg-brand-500 py-16">
        <div className="container-page text-center">
          <h2 className="font-display text-3xl font-bold text-white">Siap untuk mulai?</h2>
          <p className="mx-auto mt-3 max-w-md text-brand-100">
            Buat akun gratis dan jelajahi semua fitur dalam satu platform.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auth/register"
              className="rounded-lg bg-white px-5 py-2.5 font-semibold text-brand-600 transition-colors hover:bg-zinc-50"
            >
              Daftar sekarang
            </Link>
            <Link
              href="/auth/login"
              className="rounded-lg border border-white/40 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-white/10"
            >
              Masuk
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER (always dark) */}
      <footer className="bg-zinc-950 pt-16 pb-8">
        <div className="container-page">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2">
              <span className="font-display text-xl font-bold tracking-tight">
                <span className="text-brand-500">SEA</span>
                <span className="text-white">PEDIA</span>
              </span>
              <p className="mt-3 max-w-xs text-sm text-zinc-500">
                Tempat belanja, berjualan, dan mengantar barang dalam satu aplikasi.
              </p>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Jelajahi
              </p>
              <ul className="space-y-2">
                <li>
                  <Link href="/products" className="text-sm text-zinc-400 transition-colors hover:text-white">
                    Produk
                  </Link>
                </li>
                <li>
                  <Link href="/stores" className="text-sm text-zinc-400 transition-colors hover:text-white">
                    Toko
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Akun
              </p>
              <ul className="space-y-2">
                <li>
                  <Link href="/auth/register" className="text-sm text-zinc-400 transition-colors hover:text-white">
                    Daftar
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="text-sm text-zinc-400 transition-colors hover:text-white">
                    Masuk
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-zinc-800 pt-6 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} SEAPEDIA</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function HeroProductMockup() {
  return (
    <div className="animate-float overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-1.5 border-b border-zinc-100 bg-zinc-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-950">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <span className="ml-3 text-xs text-zinc-400 dark:text-zinc-500">app/pesanan</span>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <p className="font-display text-sm font-semibold text-zinc-950 dark:text-zinc-50">Pesanan #SP-2481</p>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
            Sedang diantar
          </span>
        </div>
        <div className="space-y-2">
          {['Kemeja katun lengan panjang', 'Sepatu lari ringan'].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="h-8 w-8 shrink-0 rounded-md bg-zinc-200 dark:bg-zinc-800" />
              <p className="text-xs text-zinc-700 dark:text-zinc-300">{item}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <span className="text-xs text-zinc-500">Total</span>
          <span className="text-sm font-bold text-zinc-950 dark:text-zinc-50">Rp 612.000</span>
        </div>
      </div>
    </div>
  )
}

function ReviewForm({ onSubmitted }: { onSubmitted: (review: Review) => void }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateReviewFormData>({
    resolver: createResolver(CreateReviewFormSchema),
    defaultValues: { reviewer_name: '', rating: 0, comment: '' },
  })

  const rating = watch('rating')

  const onSubmit = async (formData: CreateReviewFormData) => {
    try {
      const { data } = await api.post<{ success: boolean; data: Review }>('/reviews', formData)
      toast.success('Terima kasih atas ulasanmu!')
      onSubmitted(data.data)
      reset({ reviewer_name: '', rating: 0, comment: '' })
    } catch (error) {
      const apiErr = error as { response?: { data?: ApiErrorResponse } }
      toast.error(apiErr.response?.data?.message ?? 'Gagal mengirim review. Silakan coba lagi.')
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <h3 className="font-display font-semibold text-zinc-950 dark:text-zinc-50">Tulis ulasanmu</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Nama kamu" error={errors.reviewer_name?.message} {...register('reviewer_name')} />

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Rating</span>
          <StarRating value={rating} onChange={(value) => setValue('rating', value, { shouldValidate: true })} />
          {errors.rating?.message && <p className="text-xs text-danger-600 dark:text-danger-500">{errors.rating.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="comment" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Komentar
          </label>
          <textarea
            id="comment"
            rows={4}
            maxLength={1000}
            className="rounded-lg border-[1.5px] border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            {...register('comment')}
          />
          {errors.comment?.message && <p className="text-xs text-danger-600 dark:text-danger-500">{errors.comment.message}</p>}
        </div>

        <Button type="submit" isLoading={isSubmitting} className="self-start">
          Kirim ulasan
        </Button>
      </form>
    </Card>
  )
}
