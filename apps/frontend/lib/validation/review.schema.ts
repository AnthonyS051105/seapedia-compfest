import { z } from 'zod'

export const CreateReviewFormSchema = z.object({
  reviewer_name: z
    .string({ error: 'Nama wajib diisi' })
    .min(1, 'Nama tidak boleh kosong')
    .max(100, 'Nama maksimal 100 karakter'),
  rating: z
    .number({ error: 'Rating wajib diisi' })
    .int('Rating harus bilangan bulat')
    .min(1, 'Rating minimal 1')
    .max(5, 'Rating maksimal 5'),
  comment: z
    .string({ error: 'Komentar wajib diisi' })
    .min(1, 'Komentar tidak boleh kosong')
    .max(1000, 'Komentar maksimal 1000 karakter'),
})

export type CreateReviewFormData = z.infer<typeof CreateReviewFormSchema>
