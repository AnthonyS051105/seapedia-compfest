'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, useReducedMotion, Variants } from 'framer-motion'
import { Store } from 'lucide-react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { Reveal } from '@/components/ui/Reveal'
import { AdminStoreListItem, PaginatedResponse } from '@/types'

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminStoresPage() {
  return (
    <Suspense>
      <AdminStoresPageContent />
    </Suspense>
  )
}

function AdminStoresPageContent() {
  const reduceMotion = useReducedMotion()
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const [result, setResult] = useState<{
    key: number
    stores: AdminStoreListItem[]
    meta: { totalPages: number }
  } | null>(null)

  useEffect(() => {
    api
      .get<PaginatedResponse<AdminStoreListItem>>('/admin/stores', { params: { page, limit: 10 } })
      .then((res) => {
        setResult({ key: page, stores: res.data.data, meta: { totalPages: res.data.meta.totalPages } })
      })
      .catch(() => {
        setResult({ key: page, stores: [], meta: { totalPages: 0 } })
      })
  }, [page])

  const isLoading = result?.key !== page
  const stores = isLoading ? null : result.stores
  const meta = isLoading ? null : result.meta

  return (
    <div>
      <Reveal>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">Toko</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Daftar semua toko di SEAPEDIA</p>
        </div>
      </Reveal>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={56} />
          ))}
        </div>
      ) : !stores || stores.length === 0 ? (
        <EmptyState icon={Store} title="Belum ada toko" description="Belum ada toko yang dibuat." />
      ) : (
        <>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-600 dark:text-zinc-400">
                  <th className="px-4 py-3 font-medium">Nama Toko</th>
                  <th className="px-4 py-3 font-medium">Seller</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Dibuat</th>
                </tr>
              </thead>
              <motion.tbody
                initial={reduceMotion ? undefined : 'hidden'}
                whileInView={reduceMotion ? undefined : 'visible'}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ staggerChildren: 0.04 }}
              >
                {stores.map((store) => (
                  <motion.tr
                    key={store.id}
                    variants={rowVariants}
                    className="border-b border-zinc-200 dark:border-zinc-800 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-950 dark:text-zinc-50">{store.name}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {store.seller.username}
                      <span className="block text-xs text-zinc-600 dark:text-zinc-400">{store.seller.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={store.is_active ? 'green' : 'gray'}>
                        {store.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{formatDate(store.created_at)}</td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </Card>

          {meta && meta.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              onPageChange={(nextPage) => router.push(`/admin/stores?page=${nextPage}`)}
              className="mt-6"
            />
          )}
        </>
      )}
    </div>
  )
}
