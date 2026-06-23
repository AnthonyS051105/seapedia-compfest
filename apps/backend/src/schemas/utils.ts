import { z } from 'zod'

// Indonesian phone number: 08xx, +628xx, 628xx
export const phoneSchema = z
  .string()
  .regex(/^(\+62|62|0)8[0-9]{8,11}$/, 'Nomor HP tidak valid (format: 08xx atau +628xx)')

// UUID
export const uuidSchema = z.string().uuid('ID tidak valid')

// Positive price
export const priceSchema = z
  .number({ invalid_type_error: 'Harga harus berupa angka' })
  .positive('Harga harus lebih dari 0')
  .max(999_999_999, 'Harga terlalu besar')

// Non-negative stock
export const stockSchema = z
  .number({ invalid_type_error: 'Stok harus berupa angka' })
  .int('Stok harus bilangan bulat')
  .min(0, 'Stok tidak boleh negatif')

// Date in the future
export const futureDateSchema = z
  .string()
  .datetime({ message: 'Format tanggal tidak valid (gunakan ISO 8601)' })
  .refine((val) => new Date(val) > new Date(), 'Tanggal harus di masa depan')

// Pagination
export const paginationSchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})
