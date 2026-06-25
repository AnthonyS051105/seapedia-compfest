import { z } from 'zod'

export const CreateStoreSchema = z.object({
  name: z
    .string({ required_error: 'Nama toko wajib diisi' })
    .min(3, 'Nama toko minimal 3 karakter')
    .max(100, 'Nama toko maksimal 100 karakter'),

  description: z.string().max(1000).optional(),
  address:     z.string().max(500).optional(),
  logo_url:    z.string().url('URL logo tidak valid').optional(),
})

export const UpdateStoreSchema = CreateStoreSchema.partial()

export type CreateStoreDto = z.infer<typeof CreateStoreSchema>
export type UpdateStoreDto = z.infer<typeof UpdateStoreSchema>
