'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createResolver } from '@/lib/validation/resolver'
import { RegisterFormSchema, RegisterFormData } from '@/lib/validation/auth.schema'
import { ApiErrorResponse } from '@/types'

type RegisterableRole = RegisterFormData['roles'][number]

const ROLE_OPTIONS: { value: RegisterableRole; label: string }[] = [
  { value: 'BUYER', label: 'Pembeli (Buyer)' },
  { value: 'SELLER', label: 'Penjual (Seller)' },
  { value: 'DRIVER', label: 'Kurir (Driver)' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: createResolver(RegisterFormSchema),
    defaultValues: { roles: [] },
  })

  const onSubmit = async (formData: RegisterFormData) => {
    setApiError(null)
    try {
      await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name || undefined,
        roles: formData.roles,
      })

      toast.success('Akun berhasil dibuat! Silakan masuk.')
      router.push('/auth/login')
    } catch (error) {
      const apiErr = error as { response?: { data?: ApiErrorResponse } }
      const response = apiErr.response?.data

      if (response?.errors?.length) {
        response.errors.forEach((fieldError) => {
          setError(fieldError.field as keyof RegisterFormData, { message: fieldError.message })
        })
      }
      setApiError(response?.message ?? 'Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-text">Buat Akun SEAPEDIA</h1>
        <p className="mt-1 text-sm text-text-sub">Mulai berbelanja, berjualan, atau mengantar paket.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
          <Input label="Nama Lengkap" error={errors.full_name?.message} {...register('full_name')} />
          <Input label="Username" autoComplete="username" error={errors.username?.message} {...register('username')} />
          <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text">Daftar sebagai</span>
            <Controller
              name="roles"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-2">
                  {ROLE_OPTIONS.map((option) => {
                    const checked = field.value.includes(option.value)
                    return (
                      <label key={option.value} className="flex items-center gap-2 text-sm text-text">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            if (event.target.checked) {
                              field.onChange([...field.value, option.value])
                            } else {
                              field.onChange(field.value.filter((role) => role !== option.value))
                            }
                          }}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        {option.label}
                      </label>
                    )
                  })}
                </div>
              )}
            />
            {errors.roles?.message && <p className="text-sm text-danger">{errors.roles.message}</p>}
          </div>

          {apiError && <p className="text-sm text-danger">{apiError}</p>}

          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Daftar
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-sub">
          Sudah punya akun?{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}
