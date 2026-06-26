import { z } from 'zod'
import { paginationSchema } from './utils'

export const GetUsersQuerySchema = paginationSchema

export const GetStoresQuerySchema = paginationSchema

export const GetAdminProductsQuerySchema = paginationSchema.extend({
  search: z.string().max(100).optional(),
  is_active: z.coerce.boolean().optional(),
  has_stock: z.coerce.boolean().optional(),
  deleted: z.coerce.boolean().optional(),
})

export const GetAdminOrdersQuerySchema = paginationSchema.extend({
  status: z
    .enum(['SEDANG_DIKEMAS', 'MENUNGGU_PENGIRIM', 'SEDANG_DIKIRIM', 'PESANAN_SELESAI', 'DIKEMBALIKAN'])
    .optional(),
})

export const GetDeliveryJobsQuerySchema = paginationSchema

export const GetOverdueOrdersQuerySchema = paginationSchema

export type GetUsersQueryDto = z.infer<typeof GetUsersQuerySchema>
export type GetStoresQueryDto = z.infer<typeof GetStoresQuerySchema>
export type GetAdminProductsQueryDto = z.infer<typeof GetAdminProductsQuerySchema>
export type GetAdminOrdersQueryDto = z.infer<typeof GetAdminOrdersQuerySchema>
export type GetDeliveryJobsQueryDto = z.infer<typeof GetDeliveryJobsQuerySchema>
export type GetOverdueOrdersQueryDto = z.infer<typeof GetOverdueOrdersQuerySchema>
