import { z } from 'zod'

export const ProductFormSchema = z.object({
  name: z
    .string({ error: 'Nama produk wajib diisi' })
    .min(2, 'Nama produk minimal 2 karakter')
    .max(200, 'Nama produk maksimal 200 karakter'),
  description: z.string().max(2000, 'Deskripsi maksimal 2000 karakter').optional().or(z.literal('')),
  price: z.coerce
    .number({ error: 'Harga harus berupa angka' })
    .positive('Harga harus lebih dari 0')
    .max(999_999_999, 'Harga terlalu besar'),
  stock: z.coerce
    .number({ error: 'Stok harus berupa angka' })
    .int('Stok harus bilangan bulat')
    .min(0, 'Stok tidak boleh negatif'),
  images: z.string().optional().or(z.literal('')),
})

export type ProductFormData = z.infer<typeof ProductFormSchema>
