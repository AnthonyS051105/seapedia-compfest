import { z } from 'zod'

const BaseDiscountFormSchema = z.object({
  code: z
    .string({ error: 'Kode wajib diisi' })
    .min(4, 'Kode minimal 4 karakter')
    .max(20, 'Kode maksimal 20 karakter')
    .regex(/^[A-Za-z0-9]+$/, 'Kode hanya boleh huruf dan angka'),
  discount_type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT'], { error: 'Tipe diskon wajib dipilih' }),
  discount_value: z.coerce
    .number({ error: 'Nilai diskon wajib diisi' })
    .positive('Nilai diskon harus lebih dari 0'),
  max_discount_amount: z.coerce
    .number()
    .positive('Batas maksimal diskon harus lebih dari 0')
    .optional()
    .or(z.literal('')),
  min_order_amount: z.coerce
    .number()
    .positive('Minimal order harus lebih dari 0')
    .optional()
    .or(z.literal('')),
  expiry_date: z
    .string({ error: 'Tanggal kadaluarsa wajib diisi' })
    .min(1, 'Tanggal kadaluarsa wajib diisi'),
  is_active: z.boolean().default(true),
})

export const CreateVoucherFormSchema = BaseDiscountFormSchema.extend({
  max_usage: z.coerce
    .number({ error: 'Batas penggunaan wajib diisi' })
    .int('Batas penggunaan harus bilangan bulat')
    .positive('Batas penggunaan harus lebih dari 0'),
}).refine((data) => data.discount_type !== 'PERCENTAGE' || data.discount_value <= 100, {
  message: 'Nilai diskon persentase harus antara 1-100',
  path: ['discount_value'],
})

export const CreatePromoFormSchema = BaseDiscountFormSchema.extend({
  name: z.string({ error: 'Nama promo wajib diisi' }).min(2, 'Nama minimal 2 karakter').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
}).refine((data) => data.discount_type !== 'PERCENTAGE' || data.discount_value <= 100, {
  message: 'Nilai diskon persentase harus antara 1-100',
  path: ['discount_value'],
})

export type CreateVoucherFormData = z.infer<typeof CreateVoucherFormSchema>
export type CreatePromoFormData = z.infer<typeof CreatePromoFormSchema>
