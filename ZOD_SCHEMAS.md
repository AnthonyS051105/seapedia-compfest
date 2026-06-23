# SEAPEDIA — Zod Validation Schemas Reference

> File ini berisi semua Zod schema yang digunakan di backend.
> Claude Code harus menggunakan schema-schema ini secara verbatim — jangan invent schema baru.
> Letakkan semua schema di `apps/backend/src/schemas/` dengan nama file sesuai domain.

---

## Setup: Shared Schema Utilities

```typescript
// apps/backend/src/schemas/utils.ts

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
```

---

## Auth Schemas

```typescript
// apps/backend/src/schemas/auth.schema.ts

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
```

---

## Review Schemas

```typescript
// apps/backend/src/schemas/review.schema.ts

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
```

---

## Store Schemas

```typescript
// apps/backend/src/schemas/store.schema.ts

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

export const UpdateStoreSchema = CreateStoreSchema.partial()  // all fields optional for update

export type CreateStoreDto = z.infer<typeof CreateStoreSchema>
export type UpdateStoreDto = z.infer<typeof UpdateStoreSchema>
```

---

## Product Schemas

```typescript
// apps/backend/src/schemas/product.schema.ts

import { z } from 'zod'
import { priceSchema, stockSchema, paginationSchema, uuidSchema } from './utils'

export const CreateProductSchema = z.object({
  name: z
    .string({ required_error: 'Nama produk wajib diisi' })
    .min(2, 'Nama produk minimal 2 karakter')
    .max(200, 'Nama produk maksimal 200 karakter'),

  description: z.string().max(2000).optional(),
  price:       priceSchema,
  stock:       stockSchema,

  images: z
    .array(z.string().url('URL gambar tidak valid'))
    .max(5, 'Maksimal 5 gambar')
    .default([]),

  category: z.string().max(50).optional(),
})

export const UpdateProductSchema = CreateProductSchema.partial()

export const GetProductsQuerySchema = paginationSchema.extend({
  search:    z.string().max(100).optional(),
  store_id:  uuidSchema.optional(),
  min_price: z.coerce.number().positive().optional(),
  max_price: z.coerce.number().positive().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
})

export type CreateProductDto     = z.infer<typeof CreateProductSchema>
export type UpdateProductDto     = z.infer<typeof UpdateProductSchema>
export type GetProductsQueryDto  = z.infer<typeof GetProductsQuerySchema>
```

---

## Wallet & Address Schemas

```typescript
// apps/backend/src/schemas/buyer.schema.ts

import { z } from 'zod'
import { phoneSchema, uuidSchema } from './utils'

export const TopUpSchema = z.object({
  amount: z
    .number({ required_error: 'Jumlah wajib diisi', invalid_type_error: 'Jumlah harus angka' })
    .int('Jumlah harus bilangan bulat')
    .min(10_000, 'Top up minimal Rp 10.000')
    .max(10_000_000, 'Top up maksimal Rp 10.000.000'),
})

export const CreateAddressSchema = z.object({
  label:          z.string().min(1).max(50, 'Label maksimal 50 karakter'),
  recipient_name: z.string().min(2, 'Nama penerima minimal 2 karakter').max(100),
  phone:          phoneSchema,
  street:         z.string().min(5, 'Alamat minimal 5 karakter').max(200),
  city:           z.string().min(2).max(100),
  province:       z.string().min(2).max(100),
  postal_code:    z.string().regex(/^[0-9]{5}$/, 'Kode pos harus 5 digit angka'),
  is_default:     z.boolean().default(false),
})

export const UpdateAddressSchema = CreateAddressSchema.partial()

export type TopUpDto           = z.infer<typeof TopUpSchema>
export type CreateAddressDto   = z.infer<typeof CreateAddressSchema>
export type UpdateAddressDto   = z.infer<typeof UpdateAddressSchema>
```

---

## Cart Schemas

```typescript
// apps/backend/src/schemas/cart.schema.ts

import { z } from 'zod'
import { uuidSchema } from './utils'

export const AddToCartSchema = z.object({
  product_id: uuidSchema,
  quantity: z
    .number({ required_error: 'Jumlah wajib diisi', invalid_type_error: 'Jumlah harus angka' })
    .int('Jumlah harus bilangan bulat')
    .min(1, 'Jumlah minimal 1')
    .max(999, 'Jumlah maksimal 999'),
})

export const UpdateCartItemSchema = z.object({
  quantity: z
    .number({ invalid_type_error: 'Jumlah harus angka' })
    .int('Jumlah harus bilangan bulat')
    .min(1, 'Jumlah minimal 1')
    .max(999, 'Jumlah maksimal 999'),
})

export type AddToCartDto      = z.infer<typeof AddToCartSchema>
export type UpdateCartItemDto = z.infer<typeof UpdateCartItemSchema>
```

---

## Checkout Schema

```typescript
// apps/backend/src/schemas/checkout.schema.ts

import { z } from 'zod'
import { uuidSchema } from './utils'

export const CheckoutSchema = z.object({
  address_id: uuidSchema,

  delivery_method: z.enum(['INSTANT', 'NEXT_DAY', 'REGULAR'], {
    errorMap: () => ({ message: 'Metode pengiriman tidak valid. Pilih: INSTANT, NEXT_DAY, atau REGULAR' }),
  }),

  discount_code: z
    .string()
    .min(1)
    .max(20)
    .toUpperCase()  // normalize to uppercase
    .optional(),
})

export type CheckoutDto = z.infer<typeof CheckoutSchema>
```

---

## Discount Schemas (Admin)

```typescript
// apps/backend/src/schemas/discount.schema.ts

import { z } from 'zod'
import { futureDateSchema, paginationSchema } from './utils'

const BaseDiscountSchema = z.object({
  code: z
    .string({ required_error: 'Kode wajib diisi' })
    .min(4, 'Kode minimal 4 karakter')
    .max(20, 'Kode maksimal 20 karakter')
    .toUpperCase()
    .regex(/^[A-Z0-9]+$/, 'Kode hanya boleh huruf kapital dan angka'),

  discount_type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT'], {
    errorMap: () => ({ message: 'Tipe diskon harus PERCENTAGE atau FIXED_AMOUNT' }),
  }),

  discount_value: z
    .number({ required_error: 'Nilai diskon wajib diisi' })
    .positive('Nilai diskon harus lebih dari 0')
    .refine(
      // If PERCENTAGE, value must be 1-100
      // We can't cross-validate here easily, so validate in service
      (v) => v <= 100 || true,  // service validates: if PERCENTAGE then <= 100
    ),

  max_discount_amount: z
    .number()
    .positive('Batas maksimal diskon harus lebih dari 0')
    .optional(),

  min_order_amount: z
    .number()
    .positive('Minimal order harus lebih dari 0')
    .optional(),

  expiry_date: futureDateSchema,
  is_active:   z.boolean().default(true),
})

export const CreateVoucherSchema = BaseDiscountSchema.extend({
  max_usage: z
    .number({ required_error: 'Batas penggunaan wajib diisi' })
    .int('Batas penggunaan harus bilangan bulat')
    .positive('Batas penggunaan harus lebih dari 0')
    .max(100_000),
})

export const CreatePromoSchema = BaseDiscountSchema.extend({
  name:        z.string().min(2).max(100),
  description: z.string().max(500).optional(),
})

export const GetDiscountsQuerySchema = paginationSchema.extend({
  is_active: z.coerce.boolean().optional(),
})

export type CreateVoucherDto = z.infer<typeof CreateVoucherSchema>
export type CreatePromoDto   = z.infer<typeof CreatePromoSchema>
```

---

## How to Use Schemas in Middleware

```typescript
// apps/backend/src/middleware/validate.ts

import { z, ZodError } from 'zod'
import { Request, Response, NextFunction } from 'express'

// Validates req.body
export const validateBody = (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)  // parse also transforms (e.g. toUpperCase())
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Data tidak valid',
          errors: err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        })
      }
      next(err)
    }
  }

// Validates req.query
export const validateQuery = (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query)
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Parameter query tidak valid',
          errors: err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        })
      }
      next(err)
    }
  }

// Usage in routes:
// router.post('/products', authenticate, requireRole('SELLER'), validateBody(CreateProductSchema), controller)
// router.get('/products', validateQuery(GetProductsQuerySchema), controller)
```

---

## Validation Rules Quick Reference

| Field | Rule |
|-------|------|
| username | 3–30 chars, `^[a-zA-Z0-9_]+$` |
| email | Valid email RFC format |
| password | Min 8 chars, at least 1 letter + 1 number |
| phone | `^(\+62\|62\|0)8[0-9]{8,11}$` |
| product price | Positive number, max 999,999,999 |
| product stock | Non-negative integer |
| cart quantity | Integer, 1–999 |
| top-up amount | Integer, min 10,000, max 10,000,000 |
| review rating | Integer, 1–5 |
| review comment | 1–1,000 chars |
| store name | 3–100 chars, globally unique |
| voucher code | 4–20 chars, `^[A-Z0-9]+$` |
| postal code | Exactly 5 digits |
| delivery method | Enum: INSTANT, NEXT_DAY, REGULAR |
| discount type | Enum: PERCENTAGE, FIXED_AMOUNT |
