import { z } from 'zod'
import { uuidSchema } from './utils'

export const CheckoutSchema = z.object({
  address_id: uuidSchema,

  delivery_method: z.enum(['INSTANT', 'NEXT_DAY', 'REGULAR'], {
    errorMap: () => ({ message: 'Metode pengiriman tidak valid. Pilih: INSTANT, NEXT_DAY, atau REGULAR' }),
  }),

  discount_code: z
    .string()
    .min(1)
    .max(20)
    .toUpperCase()
    .optional(),
})

export type CheckoutDto = z.infer<typeof CheckoutSchema>
