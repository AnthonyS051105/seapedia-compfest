import { z } from 'zod'
import { paginationSchema } from './utils'

export const GetUsersQuerySchema = paginationSchema

export const GetStoresQuerySchema = paginationSchema

export const GetAdminOrdersQuerySchema = paginationSchema.extend({
  status: z
    .enum(['SEDANG_DIKEMAS', 'MENUNGGU_PENGIRIM', 'SEDANG_DIKIRIM', 'PESANAN_SELESAI', 'DIKEMBALIKAN'])
    .optional(),
})

export const GetDeliveryJobsQuerySchema = paginationSchema

export const GetOverdueOrdersQuerySchema = paginationSchema

export type GetUsersQueryDto = z.infer<typeof GetUsersQuerySchema>
export type GetStoresQueryDto = z.infer<typeof GetStoresQuerySchema>
export type GetAdminOrdersQueryDto = z.infer<typeof GetAdminOrdersQuerySchema>
export type GetDeliveryJobsQueryDto = z.infer<typeof GetDeliveryJobsQuerySchema>
export type GetOverdueOrdersQueryDto = z.infer<typeof GetOverdueOrdersQuerySchema>
