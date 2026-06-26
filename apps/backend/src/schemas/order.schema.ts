import { z } from 'zod'
import { paginationSchema } from './utils'

export const OrderStatusEnum = z.enum([
  'SEDANG_DIKEMAS',
  'MENUNGGU_PENGIRIM',
  'SEDANG_DIKIRIM',
  'PESANAN_SELESAI',
  'DIKEMBALIKAN',
])

export const GetOrdersQuerySchema = paginationSchema.extend({
  status: OrderStatusEnum.optional(),
})

export const GetIncomeReportQuerySchema = z.object({
  from_date: z.string().datetime({ message: 'Format from_date tidak valid (gunakan ISO 8601)' }).optional(),
  to_date: z.string().datetime({ message: 'Format to_date tidak valid (gunakan ISO 8601)' }).optional(),
})

export const GetSpendingReportQuerySchema = z.object({
  from_date: z.string().datetime({ message: 'Format from_date tidak valid (gunakan ISO 8601)' }).optional(),
  to_date: z.string().datetime({ message: 'Format to_date tidak valid (gunakan ISO 8601)' }).optional(),
})

export type GetOrdersQueryDto = z.infer<typeof GetOrdersQuerySchema>
export type GetIncomeReportQueryDto = z.infer<typeof GetIncomeReportQuerySchema>
export type GetSpendingReportQueryDto = z.infer<typeof GetSpendingReportQuerySchema>
