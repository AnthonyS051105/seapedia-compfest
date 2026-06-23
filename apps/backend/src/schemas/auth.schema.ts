import { z } from 'zod'
import { phoneSchema } from './utils'

export const RegisterSchema = z.object({
  username: z
    .string({ required_error: 'Username wajib diisi' })
    .min(3, 'Username minimal 3 karakter')
    .max(30, 'Username maksimal 30 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),

  email: z
    .string({ required_error: 'Email wajib diisi' })
    .email('Format email tidak valid'),

  password: z
    .string({ required_error: 'Password wajib diisi' })
    .min(8, 'Password minimal 8 karakter')
    .regex(/[a-zA-Z]/, 'Password harus mengandung huruf')
    .regex(/[0-9]/, 'Password harus mengandung angka'),

  full_name: z.string().max(100).optional(),
  phone:     phoneSchema.optional(),

  // Roles to register with (min 1)
  roles: z
    .array(z.enum(['BUYER', 'SELLER', 'DRIVER']))
    .min(1, 'Pilih minimal satu peran')
    .max(3),
})

export const LoginSchema = z.object({
  // Accept either email or username
  email:    z.string().email().optional(),
  username: z.string().min(3).max(30).optional(),
  password: z.string().min(1, 'Password wajib diisi'),
}).refine(
  (data) => data.email || data.username,
  { message: 'Email atau username wajib diisi', path: ['email'] }
)

export const SelectRoleSchema = z.object({
  role: z.enum(['BUYER', 'SELLER', 'DRIVER', 'ADMIN'], {
    errorMap: () => ({ message: 'Peran tidak valid' }),
  }),
})

export const AddRoleSchema = z.object({
  role: z.enum(['BUYER', 'SELLER', 'DRIVER']),
})

// Types (reused in controllers)
export type RegisterDto    = z.infer<typeof RegisterSchema>
export type LoginDto       = z.infer<typeof LoginSchema>
export type SelectRoleDto  = z.infer<typeof SelectRoleSchema>
