'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Store as StoreIcon, Pencil } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { createResolver } from '@/lib/validation/resolver'
import { StoreFormSchema, StoreFormData } from '@/lib/validation/store.schema'
import { ApiErrorResponse, ApiResponse, Store } from '@/types'

export default function SellerStorePage() {
  const [store, setStore] = useState<Store | null | undefined>(undefined)
  const [isEditing, setIsEditing] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    api
      .get<ApiResponse<Store | null>>('/seller/store')
      .then((res) => {
        if (!isCurrent) return
        setStore(res.data.data)
      })
      .catch(() => {
        if (!isCurrent) return
        setStore(null)
      })
    return () => {
      isCurrent = false
    }
  }, [])

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StoreFormData>({ resolver: createResolver(StoreFormSchema) })

  const startEditing = () => {
    if (store) {
      reset({
        name: store.name,
        description: store.description ?? '',
        address: store.address ?? '',
        logo_url: store.logo_url ?? '',
      })
    } else {
      reset({ name: '', description: '', address: '', logo_url: '' })
    }
    setApiError(null)
    setIsEditing(true)
  }

  const onSubmit = async (formData: StoreFormData) => {
    setApiError(null)
    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      address: formData.address || undefined,
      logo_url: formData.logo_url || undefined,
    }

    try {
      const { data } = store
        ? await api.put<ApiResponse<Store>>('/seller/store', payload)
        : await api.post<ApiResponse<Store>>('/seller/store', payload)

      setStore(data.data)
      setIsEditing(false)
      toast.success(store ? 'Toko berhasil diperbarui' : 'Toko berhasil dibuat')
    } catch (error) {
      const apiErr = error as { response?: { data?: ApiErrorResponse } }
      const response = apiErr.response?.data

      if (response?.errors?.length) {
        response.errors.forEach((fieldError) => {
          setError(fieldError.field as keyof StoreFormData, { message: fieldError.message })
        })
      }
      setApiError(response?.message ?? 'Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  if (store === undefined) {
    return (
      <div className="mx-auto max-w-2xl">
        <Skeleton height={200} />
      </div>
    )
  }

  if (!isEditing) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-text">Toko Saya</h1>

        {store ? (
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text">{store.name}</h2>
                {store.description && <p className="mt-1 text-sm text-text-sub">{store.description}</p>}
                {store.address && <p className="mt-2 text-sm text-text-sub">📍 {store.address}</p>}
              </div>
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="flex flex-col items-center gap-3 py-10 text-center">
            <StoreIcon className="h-10 w-10 text-text-sub" />
            <h2 className="text-lg font-semibold text-text">Kamu belum memiliki toko</h2>
            <p className="text-sm text-text-sub">Buat toko untuk mulai menjual produk di SEAPEDIA.</p>
            <Button onClick={startEditing} className="mt-2">
              Buat Toko
            </Button>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-text">{store ? 'Edit Toko' : 'Buat Toko'}</h1>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Nama Toko"
            placeholder="Toko Elektronik Maju"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Deskripsi"
            placeholder="Menjual berbagai perangkat elektronik..."
            error={errors.description?.message}
            {...register('description')}
          />
          <Input
            label="Alamat"
            placeholder="Jl. Merdeka No. 10, Jakarta Selatan"
            error={errors.address?.message}
            {...register('address')}
          />
          <Input
            label="URL Logo"
            placeholder="https://..."
            error={errors.logo_url?.message}
            {...register('logo_url')}
          />

          {apiError && <p className="text-sm text-danger">{apiError}</p>}

          <div className="mt-2 flex gap-3">
            <Button type="submit" isLoading={isSubmitting}>
              {store ? 'Simpan Perubahan' : 'Buat Toko'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
              Batal
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
