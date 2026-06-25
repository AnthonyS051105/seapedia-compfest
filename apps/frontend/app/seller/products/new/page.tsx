'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { createResolver } from '@/lib/validation/resolver'
import { ProductFormSchema, ProductFormData } from '@/lib/validation/product.schema'
import { ApiErrorResponse, ApiResponse, SellerProduct } from '@/types'

function parseImageUrls(input: string): string[] {
  return input
    .split(',')
    .map((url) => url.trim())
    .filter((url) => url.length > 0)
}

export default function NewProductPage() {
  const router = useRouter()
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({ resolver: createResolver(ProductFormSchema) })

  const onSubmit = async (formData: ProductFormData) => {
    setApiError(null)
    try {
      await api.post<ApiResponse<SellerProduct>>('/seller/products', {
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price,
        stock: formData.stock,
        images: parseImageUrls(formData.images ?? ''),
      })

      toast.success('Produk berhasil dibuat')
      router.push('/seller/products')
    } catch (error) {
      const apiErr = error as { response?: { data?: ApiErrorResponse } }
      const response = apiErr.response?.data

      if (response?.errors?.length) {
        response.errors.forEach((fieldError) => {
          setError(fieldError.field as keyof ProductFormData, { message: fieldError.message })
        })
      }
      setApiError(response?.message ?? 'Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-text">Tambah Produk</h1>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Nama Produk"
            placeholder="Headphone Wireless"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Deskripsi"
            placeholder="Headphone bluetooth kualitas premium"
            error={errors.description?.message}
            {...register('description')}
          />
          <Input
            label="Harga (Rp)"
            type="number"
            placeholder="250000"
            error={errors.price?.message}
            {...register('price')}
          />
          <Input
            label="Stok"
            type="number"
            placeholder="15"
            error={errors.stock?.message}
            {...register('stock')}
          />
          <Input
            label="URL Gambar (pisahkan dengan koma)"
            placeholder="https://contoh.com/gambar1.jpg, https://contoh.com/gambar2.jpg"
            error={errors.images?.message}
            {...register('images')}
          />

          {apiError && <p className="text-sm text-danger">{apiError}</p>}

          <div className="mt-2 flex gap-3">
            <Button type="submit" isLoading={isSubmitting}>
              Simpan Produk
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/seller/products')} disabled={isSubmitting}>
              Batal
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
