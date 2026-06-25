'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { createResolver } from '@/lib/validation/resolver'
import { ProductFormSchema, ProductFormData } from '@/lib/validation/product.schema'
import { ApiErrorResponse, ApiResponse, SellerProduct } from '@/types'

function parseImageUrls(input: string): string[] {
  return input
    .split(',')
    .map((url) => url.trim())
    .filter((url) => url.length > 0)
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({ resolver: createResolver(ProductFormSchema) })

  useEffect(() => {
    let isCurrent = true

    api
      .get<ApiResponse<SellerProduct>>(`/seller/products/${params.id}`)
      .then((res) => {
        if (!isCurrent) return
        const product = res.data.data
        reset({
          name: product.name,
          description: product.description ?? '',
          price: product.price,
          stock: product.stock,
          images: product.images.join(', '),
        })
        setIsLoading(false)
      })
      .catch(() => {
        if (!isCurrent) return
        setNotFound(true)
        setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [params.id, reset])

  const onSubmit = async (formData: ProductFormData) => {
    setApiError(null)
    try {
      await api.put<ApiResponse<SellerProduct>>(`/seller/products/${params.id}`, {
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price,
        stock: formData.stock,
        images: parseImageUrls(formData.images ?? ''),
      })

      toast.success('Produk berhasil diperbarui')
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

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <Skeleton height={400} />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-text-sub">Produk tidak ditemukan.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/seller/products')}>
          Kembali ke Daftar Produk
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-text">Edit Produk</h1>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Nama Produk" error={errors.name?.message} {...register('name')} />
          <Input label="Deskripsi" error={errors.description?.message} {...register('description')} />
          <Input label="Harga (Rp)" type="number" error={errors.price?.message} {...register('price')} />
          <Input
            label="Stok"
            type="number"
            min={0}
            error={errors.stock?.message}
            {...register('stock')}
          />
          <Input
            label="URL Gambar (pisahkan dengan koma)"
            error={errors.images?.message}
            {...register('images')}
          />

          {apiError && <p className="text-sm text-danger">{apiError}</p>}

          <div className="mt-2 flex gap-3">
            <Button type="submit" isLoading={isSubmitting}>
              Simpan Perubahan
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/seller/products')}
              disabled={isSubmitting}
            >
              Batal
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
