import { z } from 'zod'

export const TopUpFormSchema = z.object({
  amount: z.coerce
    .number({ error: 'Jumlah harus berupa angka' })
    .int('Jumlah harus bilangan bulat')
    .min(10_000, 'Top up minimal Rp 10.000')
    .max(10_000_000, 'Top up maksimal Rp 10.000.000'),
})

export type TopUpFormData = z.infer<typeof TopUpFormSchema>

export const AddressFormSchema = z.object({
  label: z.string({ error: 'Label wajib diisi' }).min(1, 'Label wajib diisi').max(50, 'Label maksimal 50 karakter'),
  recipient_name: z
    .string({ error: 'Nama penerima wajib diisi' })
    .min(2, 'Nama penerima minimal 2 karakter')
    .max(100, 'Nama penerima maksimal 100 karakter'),
  phone: z
    .string({ error: 'Nomor HP wajib diisi' })
    .regex(/^(\+62|62|0)8[0-9]{8,11}$/, 'Nomor HP tidak valid (format: 08xx atau +628xx)'),
  street: z.string({ error: 'Alamat wajib diisi' }).min(5, 'Alamat minimal 5 karakter').max(200, 'Alamat maksimal 200 karakter'),
  city: z.string({ error: 'Kota wajib diisi' }).min(2, 'Kota minimal 2 karakter').max(100),
  province: z.string({ error: 'Provinsi wajib diisi' }).min(2, 'Provinsi minimal 2 karakter').max(100),
  postal_code: z.string({ error: 'Kode pos wajib diisi' }).regex(/^[0-9]{5}$/, 'Kode pos harus 5 digit angka'),
  is_default: z.boolean().optional(),
})

export type AddressFormData = z.infer<typeof AddressFormSchema>
