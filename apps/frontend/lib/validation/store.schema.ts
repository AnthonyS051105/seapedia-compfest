import { z } from 'zod'

export const StoreFormSchema = z.object({
  name: z
    .string({ error: 'Nama toko wajib diisi' })
    .min(3, 'Nama toko minimal 3 karakter')
    .max(100, 'Nama toko maksimal 100 karakter'),
  description: z.string().max(1000, 'Deskripsi maksimal 1000 karakter').optional().or(z.literal('')),
  address: z.string().max(500, 'Alamat maksimal 500 karakter').optional().or(z.literal('')),
  logo_url: z.string().url('URL logo tidak valid').optional().or(z.literal('')),
})

export type StoreFormData = z.infer<typeof StoreFormSchema>
