import { z } from 'zod'
import { priceSchema, stockSchema, paginationSchema, uuidSchema } from './utils'

export const CreateProductSchema = z.object({
  name: z
    .string({ required_error: 'Nama produk wajib diisi' })
    .min(2, 'Nama produk minimal 2 karakter')
    .max(200, 'Nama produk maksimal 200 karakter'),

  description: z.string().max(2000).optional(),
  price:       priceSchema,
  stock:       stockSchema,

  images: z
    .array(z.string().url('URL gambar tidak valid'))
    .max(5, 'Maksimal 5 gambar')
    .default([]),

  category: z.string().max(50).optional(),
})

export const UpdateProductSchema = CreateProductSchema.partial()

export const GetProductsQuerySchema = paginationSchema.extend({
  search:    z.string().max(100).optional(),
  store_id:  uuidSchema.optional(),
  min_price: z.coerce.number().positive().optional(),
  max_price: z.coerce.number().positive().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
})

export type CreateProductDto     = z.infer<typeof CreateProductSchema>
export type UpdateProductDto     = z.infer<typeof UpdateProductSchema>
export type GetProductsQueryDto  = z.infer<typeof GetProductsQuerySchema>
