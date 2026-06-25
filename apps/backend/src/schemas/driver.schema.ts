import { z } from 'zod'
import { paginationSchema } from './utils'

export const GetDriverJobsQuerySchema = paginationSchema

export const GetDriverEarningsQuerySchema = z.object({
  from_date: z.string().datetime({ message: 'Format from_date tidak valid (gunakan ISO 8601)' }).optional(),
  to_date: z.string().datetime({ message: 'Format to_date tidak valid (gunakan ISO 8601)' }).optional(),
})

export type GetDriverJobsQueryDto = z.infer<typeof GetDriverJobsQuerySchema>
export type GetDriverEarningsQueryDto = z.infer<typeof GetDriverEarningsQuerySchema>
