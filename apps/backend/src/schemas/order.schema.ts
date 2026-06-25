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

export type GetOrdersQueryDto = z.infer<typeof GetOrdersQuerySchema>
