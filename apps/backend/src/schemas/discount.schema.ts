import { z } from 'zod'
import { futureDateSchema, paginationSchema } from './utils'

const BaseDiscountSchema = z.object({
  code: z
    .string({ required_error: 'Kode wajib diisi' })
    .min(4, 'Kode minimal 4 karakter')
    .max(20, 'Kode maksimal 20 karakter')
    .toUpperCase()
    .regex(/^[A-Z0-9]+$/, 'Kode hanya boleh huruf kapital dan angka'),

  discount_type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT'], {
    errorMap: () => ({ message: 'Tipe diskon harus PERCENTAGE atau FIXED_AMOUNT' }),
  }),

  discount_value: z
    .number({ required_error: 'Nilai diskon wajib diisi' })
    .positive('Nilai diskon harus lebih dari 0'),

  max_discount_amount: z
    .number()
    .positive('Batas maksimal diskon harus lebih dari 0')
    .optional(),

  min_order_amount: z
    .number()
    .positive('Minimal order harus lebih dari 0')
    .optional(),

  expiry_date: futureDateSchema,
  is_active: z.boolean().default(true),
})

export const CreateVoucherSchema = BaseDiscountSchema.extend({
  max_usage: z
    .number({ required_error: 'Batas penggunaan wajib diisi' })
    .int('Batas penggunaan harus bilangan bulat')
    .positive('Batas penggunaan harus lebih dari 0')
    .max(100_000),
}).refine((data) => data.discount_type !== 'PERCENTAGE' || data.discount_value <= 100, {
  message: 'Nilai diskon persentase harus antara 1-100',
  path: ['discount_value'],
})

export const CreatePromoSchema = BaseDiscountSchema.extend({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
}).refine((data) => data.discount_type !== 'PERCENTAGE' || data.discount_value <= 100, {
  message: 'Nilai diskon persentase harus antara 1-100',
  path: ['discount_value'],
})

export const GetDiscountsQuerySchema = paginationSchema.extend({
  is_active: z.coerce.boolean().optional(),
})

export const ValidateDiscountCodeQuerySchema = z.object({
  code: z
    .string({ required_error: 'Kode wajib diisi' })
    .min(1, 'Kode wajib diisi')
    .toUpperCase(),
  subtotal: z.coerce
    .number({ invalid_type_error: 'Subtotal harus berupa angka' })
    .nonnegative('Subtotal tidak boleh negatif')
    .default(0),
})

export type CreateVoucherDto = z.infer<typeof CreateVoucherSchema>
export type CreatePromoDto = z.infer<typeof CreatePromoSchema>
export type GetDiscountsQueryDto = z.infer<typeof GetDiscountsQuerySchema>
export type ValidateDiscountCodeQueryDto = z.infer<typeof ValidateDiscountCodeQuerySchema>
