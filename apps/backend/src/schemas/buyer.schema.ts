import { z } from 'zod'
import { phoneSchema } from './utils'

export const TopUpSchema = z.object({
  amount: z
    .number({ required_error: 'Jumlah wajib diisi', invalid_type_error: 'Jumlah harus angka' })
    .int('Jumlah harus bilangan bulat')
    .min(10_000, 'Top up minimal Rp 10.000')
    .max(10_000_000, 'Top up maksimal Rp 10.000.000'),
})

export const CreateAddressSchema = z.object({
  label: z.string().min(1).max(50, 'Label maksimal 50 karakter'),
  recipient_name: z.string().min(2, 'Nama penerima minimal 2 karakter').max(100),
  phone: phoneSchema,
  street: z.string().min(5, 'Alamat minimal 5 karakter').max(200),
  city: z.string().min(2).max(100),
  province: z.string().min(2).max(100),
  postal_code: z.string().regex(/^[0-9]{5}$/, 'Kode pos harus 5 digit angka'),
  is_default: z.boolean().default(false),
})

export const UpdateAddressSchema = CreateAddressSchema.partial()

export type TopUpDto = z.infer<typeof TopUpSchema>
export type CreateAddressDto = z.infer<typeof CreateAddressSchema>
export type UpdateAddressDto = z.infer<typeof UpdateAddressSchema>
