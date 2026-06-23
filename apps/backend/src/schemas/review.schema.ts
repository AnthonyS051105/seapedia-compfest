import { z } from 'zod'
import { paginationSchema } from './utils'

export const CreateReviewSchema = z.object({
  reviewer_name: z
    .string({ required_error: 'Nama wajib diisi' })
    .min(1, 'Nama tidak boleh kosong')
    .max(100, 'Nama maksimal 100 karakter'),

  rating: z
    .number({ required_error: 'Rating wajib diisi', invalid_type_error: 'Rating harus angka' })
    .int('Rating harus bilangan bulat')
    .min(1, 'Rating minimal 1')
    .max(5, 'Rating maksimal 5'),

  comment: z
    .string({ required_error: 'Komentar wajib diisi' })
    .min(1, 'Komentar tidak boleh kosong')
    .max(1000, 'Komentar maksimal 1000 karakter'),
})

export const GetReviewsQuerySchema = paginationSchema

export type CreateReviewDto = z.infer<typeof CreateReviewSchema>
