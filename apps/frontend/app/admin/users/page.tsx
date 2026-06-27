'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Users } from 'lucide-react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { AdminUserListItem, PaginatedResponse, Role } from '@/types'

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const ROLE_BADGE_VARIANT: Record<Role, 'red' | 'blue' | 'green' | 'orange'> = {
  ADMIN: 'red',
  SELLER: 'blue',
  BUYER: 'green',
  DRIVER: 'orange',
}

export default function AdminUsersPage() {
  return (
    <Suspense>
      <AdminUsersPageContent />
    </Suspense>
  )
}

function AdminUsersPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const [result, setResult] = useState<{
    key: number
    users: AdminUserListItem[]
    meta: { totalPages: number }
  } | null>(null)

  useEffect(() => {
    api
      .get<PaginatedResponse<AdminUserListItem>>('/admin/users', { params: { page, limit: 10 } })
      .then((res) => {
        setResult({ key: page, users: res.data.data, meta: { totalPages: res.data.meta.totalPages } })
      })
      .catch(() => {
        setResult({ key: page, users: [], meta: { totalPages: 0 } })
      })
  }, [page])

  const isLoading = result?.key !== page
  const users = isLoading ? null : result.users
  const meta = isLoading ? null : result.meta

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">Pengguna</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Daftar semua pengguna SEAPEDIA</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={56} />
          ))}
        </div>
      ) : !users || users.length === 0 ? (
        <EmptyState icon={Users} title="Belum ada pengguna" description="Belum ada pengguna terdaftar." />
      ) : (
        <>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-600 dark:text-zinc-400">
                  <th className="px-4 py-3 font-medium">Username</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Peran</th>
                  <th className="px-4 py-3 font-medium">Terdaftar</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-zinc-200 dark:border-zinc-800 last:border-0">
                    <td className="px-4 py-3 font-medium text-zinc-950 dark:text-zinc-50">{user.username}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{user.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role} variant={ROLE_BADGE_VARIANT[role]}>
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{formatDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {meta && meta.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              onPageChange={(nextPage) => router.push(`/admin/users?page=${nextPage}`)}
              className="mt-6"
            />
          )}
        </>
      )}
    </div>
  )
}
