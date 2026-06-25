import { z } from 'zod'
import { uuidSchema } from './utils'

export const AddToCartSchema = z.object({
  product_id: uuidSchema,
  quantity: z
    .number({ required_error: 'Jumlah wajib diisi', invalid_type_error: 'Jumlah harus angka' })
    .int('Jumlah harus bilangan bulat')
    .min(1, 'Jumlah minimal 1')
    .max(999, 'Jumlah maksimal 999'),
})

export const UpdateCartItemSchema = z.object({
  quantity: z
    .number({ invalid_type_error: 'Jumlah harus angka' })
    .int('Jumlah harus bilangan bulat')
    .min(1, 'Jumlah minimal 1')
    .max(999, 'Jumlah maksimal 999'),
})

export type AddToCartDto = z.infer<typeof AddToCartSchema>
export type UpdateCartItemDto = z.infer<typeof UpdateCartItemSchema>
