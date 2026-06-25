'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createResolver } from '@/lib/validation/resolver'
import { LoginFormSchema, LoginFormData } from '@/lib/validation/auth.schema'
import { ApiErrorResponse, ApiResponse, User } from '@/types'

interface LoginResponseData {
  access_token: string
  token_type: string
  expires_in: number
  user: User
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: createResolver(LoginFormSchema) })

  const onSubmit = async (formData: LoginFormData) => {
    setApiError(null)
    try {
      const payload = EMAIL_REGEX.test(formData.identifier)
        ? { email: formData.identifier, password: formData.password }
        : { username: formData.identifier, password: formData.password }

      const { data } = await api.post<ApiResponse<LoginResponseData>>('/auth/login', payload)
      const { access_token, user } = data.data

      setAuth(user, access_token)
      toast.success(`Selamat datang, ${user.username}!`)

      if (!user.active_role) {
        router.push('/auth/select-role')
        return
      }

      router.push(`/${user.active_role.toLowerCase()}/dashboard`)
    } catch (error) {
      const apiErr = error as { response?: { data?: ApiErrorResponse } }
      const response = apiErr.response?.data

      if (response?.errors?.length) {
        response.errors.forEach((fieldError) => {
          setError(fieldError.field as keyof LoginFormData, { message: fieldError.message })
        })
      }
      setApiError(response?.message ?? 'Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-text">Masuk ke SEAPEDIA</h1>
        <p className="mt-1 text-sm text-text-sub">Belanja, jual, atau antar paket di satu platform.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
          <Input
            label="Email atau Username"
            type="text"
            autoComplete="username"
            error={errors.identifier?.message}
            {...register('identifier')}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          {apiError && <p className="text-sm text-danger">{apiError}</p>}

          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Masuk
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-sub">
          Belum punya akun?{' '}
          <Link href="/auth/register" className="font-medium text-primary hover:underline">
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  )
}
