import { z } from 'zod'

export const LoginFormSchema = z.object({
  identifier: z
    .string({ error: 'Email atau username wajib diisi' })
    .min(1, 'Email atau username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
})

export type LoginFormData = z.infer<typeof LoginFormSchema>

export const RegisterFormSchema = z.object({
  username: z
    .string({ error: 'Username wajib diisi' })
    .min(3, 'Username minimal 3 karakter')
    .max(30, 'Username maksimal 30 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),
  email: z.string({ error: 'Email wajib diisi' }).email('Format email tidak valid'),
  password: z
    .string({ error: 'Password wajib diisi' })
    .min(8, 'Password minimal 8 karakter')
    .regex(/[a-zA-Z]/, 'Password harus mengandung huruf')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  full_name: z.string().max(100).optional().or(z.literal('')),
  roles: z
    .array(z.enum(['BUYER', 'SELLER', 'DRIVER']))
    .min(1, 'Pilih minimal satu peran'),
})

export type RegisterFormData = z.infer<typeof RegisterFormSchema>
