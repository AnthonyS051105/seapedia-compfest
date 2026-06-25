'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ShoppingBag, Store as StoreIcon, MessageSquarePlus, Search, Truck, PackageCheck } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { StarRating } from '@/components/ui/StarRating'
import { ProductCard } from '@/components/public/ProductCard'
import { createResolver } from '@/lib/validation/resolver'
import { CreateReviewFormSchema, CreateReviewFormData } from '@/lib/validation/review.schema'
import { ApiErrorResponse, PaginatedResponse, Product, Review } from '@/types'

const HOW_IT_WORKS = [
  { icon: Search, title: 'Pilih', description: 'Jelajahi ribuan produk dari berbagai toko terpercaya.' },
  { icon: ShoppingBag, title: 'Beli', description: 'Bayar dengan dompet digital, aman dan instan.' },
  { icon: Truck, title: 'Terima', description: 'Lacak pengiriman hingga pesanan tiba di tanganmu.' },
]

export default function LandingPage() {
  const [products, setProducts] = useState<Product[] | null>(null)
  const [reviews, setReviews] = useState<Review[] | null>(null)

  useEffect(() => {
    api
      .get<PaginatedResponse<Product>>('/products', { params: { limit: 8 } })
      .then((res) => setProducts(res.data.data))
      .catch(() => setProducts([]))

    api
      .get<PaginatedResponse<Review>>('/reviews', { params: { limit: 6 } })
      .then((res) => setReviews(res.data.data))
      .catch(() => setReviews([]))
  }, [])

  const handleReviewSubmitted = (review: Review) => {
    setReviews((prev) => [review, ...(prev ?? [])])
  }

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-border bg-gradient-to-b from-blue-50 to-white px-4 py-16 sm:px-6">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-6 text-center">
          <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-text sm:text-4xl">
            Belanja dari ribuan toko terpercaya di SEAPEDIA
          </h1>
          <p className="max-w-xl text-text-sub">
            Marketplace multi-peran untuk Pembeli, Penjual, dan Kurir — semua dalam satu platform.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/products">
              <Button size="lg">
                <ShoppingBag className="h-4 w-4" />
                Mulai Belanja
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="outline" size="lg">
                <StoreIcon className="h-4 w-4" />
                Jual Sekarang
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-text">Produk Unggulan</h2>
            <Link href="/products" className="text-sm font-medium text-primary hover:underline">
              Lihat Semua Produk →
            </Link>
          </div>

          {products === null ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} height={220} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState icon={PackageCheck} title="Belum ada produk tersedia" />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-gray-50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="mb-8 text-center text-xl font-bold text-text">Cara Belanja di SEAPEDIA</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon
              return (
                <Card key={step.title} className="flex flex-col items-center gap-3 p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-text">{step.title}</h3>
                  <p className="text-sm text-text-sub">{step.description}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="mb-8 text-center text-xl font-bold text-text">Apa Kata Mereka Tentang SEAPEDIA?</h2>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              {reviews === null ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={100} />)
              ) : reviews.length === 0 ? (
                <EmptyState icon={MessageSquarePlus} title="Jadilah yang pertama memberikan ulasan!" />
              ) : (
                reviews.map((review) => (
                  <Card key={review.id} className="flex flex-col gap-2">
                    <StarRating value={review.rating} size={16} />
                    <p className="text-sm text-text">&ldquo;{review.comment}&rdquo;</p>
                    <p className="text-sm font-medium text-text-sub">— {review.reviewer_name}</p>
                  </Card>
                ))
              )}
            </div>

            <ReviewForm onSubmitted={handleReviewSubmitted} />
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-surface px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 text-sm text-text-sub sm:flex-row">
          <p>© {new Date().getFullYear()} SEAPEDIA — COMPFEST 18 Software Engineering Academy</p>
          <div className="flex gap-4">
            <Link href="/products" className="hover:text-primary">
              Produk
            </Link>
            <Link href="/auth/login" className="hover:text-primary">
              Masuk
            </Link>
            <Link href="/auth/register" className="hover:text-primary">
              Daftar
            </Link>
          </div>
        </div>
      </footer>
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
      <h3 className="font-semibold text-text">Bagikan Pengalamanmu dengan SEAPEDIA</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Nama Kamu" error={errors.reviewer_name?.message} {...register('reviewer_name')} />

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text">Rating</span>
          <StarRating value={rating} onChange={(value) => setValue('rating', value, { shouldValidate: true })} />
          {errors.rating?.message && <p className="text-sm text-danger">{errors.rating.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="comment" className="text-sm font-medium text-text">
            Komentar
          </label>
          <textarea
            id="comment"
            rows={4}
            maxLength={1000}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-base text-text outline-none focus:border-primary"
            {...register('comment')}
          />
          {errors.comment?.message && <p className="text-sm text-danger">{errors.comment.message}</p>}
        </div>

        <Button type="submit" isLoading={isSubmitting} className="self-start">
          Kirim Review
        </Button>
      </form>
    </Card>
  )
}
