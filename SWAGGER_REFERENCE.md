# SEAPEDIA — Swagger Annotation Reference

> File ini adalah panduan dan template anotasi Swagger untuk semua endpoint.
> Claude Code harus mengikuti pola ini secara konsisten di semua route file.
> Jangan ubah format — inkonsistensi akan merusak Swagger UI.

---

## 1. Setup Swagger (Jalankan Sekali)

```typescript
// apps/backend/src/config/swagger.ts

import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SEAPEDIA API',
      version: '1.0.0',
      description: 'REST API untuk marketplace SEAPEDIA — COMPFEST 18',
    },
    servers: [
      { url: 'http://localhost:3001/api', description: 'Development' },
      { url: 'https://seapedia-api.railway.app/api', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token dari POST /auth/login (berlaku 15 menit)',
        },
      },
      schemas: {
        // Reusable response schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Berhasil' },
            data: { type: 'object' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: {} },
            meta: {
              type: 'object',
              properties: {
                page:       { type: 'integer', example: 1 },
                limit:      { type: 'integer', example: 10 },
                total:      { type: 'integer', example: 100 },
                totalPages: { type: 'integer', example: 10 },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Terjadi kesalahan' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field:   { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Format email tidak valid' },
                },
              },
            },
          },
        },
      },
    },
  },
  // Glob untuk semua route files
  apis: ['./src/routes/*.ts'],
}

export const swaggerSpec = swaggerJsdoc(options)
```

```typescript
// Daftarkan di apps/backend/src/app.ts
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './config/swagger'

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec))
```

---

## 2. Pola Anotasi Per Endpoint

Setiap route wajib memiliki anotasi JSDoc Swagger langsung di atas `router.METHOD(...)`.

### Format Dasar

```typescript
/**
 * @swagger
 * /path/to/endpoint:
 *   METHOD:
 *     summary: Satu kalimat deskripsi singkat
 *     description: Deskripsi lebih panjang jika perlu (opsional)
 *     tags: [TagName]
 *     security:                    ← hapus jika endpoint publik
 *       - bearerAuth: []
 *     parameters:                  ← untuk path params dan query params
 *       - ...
 *     requestBody:                 ← untuk POST/PUT
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             ...
 *     responses:
 *       200:
 *         description: Sukses
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Token tidak valid atau tidak ada
 *       403:
 *         description: Akses ditolak (role salah atau bukan pemilik)
 *       404:
 *         description: Data tidak ditemukan
 *       409:
 *         description: Konflik (duplikat atau pelanggaran aturan bisnis)
 */
router.METHOD('/path', middlewares, controller)
```

---

## 3. Contoh Lengkap Per Group

### Group: Auth

```typescript
// apps/backend/src/routes/auth.routes.ts

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Registrasi, login, logout, dan manajemen token
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Daftarkan akun baru
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password, roles]
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: Password123
 *               full_name:
 *                 type: string
 *                 example: John Doe
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [BUYER, SELLER, DRIVER]
 *                 minItems: 1
 *                 example: [BUYER]
 *     responses:
 *       201:
 *         description: Akun berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Akun berhasil dibuat }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:       { type: string, format: uuid }
 *                     username: { type: string, example: johndoe }
 *                     email:    { type: string, example: john@example.com }
 *                     roles:    { type: array, items: { type: string }, example: [BUYER] }
 *       400:
 *         description: Validasi gagal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Username atau email sudah digunakan
 */
router.post('/register', validateBody(RegisterSchema), authController.register)

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login dan dapatkan access token
 *     description: |
 *       Mengembalikan access token (15 menit) di body respons.
 *       Refresh token (7 hari) di-set sebagai httpOnly cookie.
 *       Jika user memiliki lebih dari 1 role, active_role akan null dan
 *       frontend harus redirect ke /auth/select-role.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: buyer1@seapedia.com
 *               username:
 *                 type: string
 *                 example: buyer1
 *               password:
 *                 type: string
 *                 example: Buyer@123
 *             anyOf:
 *               - required: [email, password]
 *               - required: [username, password]
 *     responses:
 *       200:
 *         description: Login berhasil
 *         headers:
 *           Set-Cookie:
 *             description: httpOnly refresh token cookie
 *             schema:
 *               type: string
 *               example: seapedia_refresh_token=xxx; HttpOnly; Secure; SameSite=Strict
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     access_token:  { type: string, example: eyJhbGciOiJIUzI1NiJ9... }
 *                     token_type:    { type: string, example: Bearer }
 *                     expires_in:    { type: integer, example: 900 }
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:          { type: string, format: uuid }
 *                         username:    { type: string }
 *                         email:       { type: string }
 *                         roles:       { type: array, items: { type: string } }
 *                         active_role: { type: string, nullable: true, example: BUYER }
 *       401:
 *         description: Email/username atau password salah
 */
router.post('/login', validateBody(LoginSchema), authController.login)

/**
 * @swagger
 * /auth/select-role:
 *   post:
 *     summary: Pilih peran aktif setelah login
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [BUYER, SELLER, DRIVER, ADMIN]
 *                 example: BUYER
 *     responses:
 *       200:
 *         description: Peran berhasil dipilih, access token baru diterbitkan
 *       403:
 *         description: User tidak memiliki peran yang diminta
 */
router.post('/select-role', authenticate, validateBody(SelectRoleSchema), authController.selectRole)

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Perbarui access token menggunakan refresh token
 *     description: Refresh token dikirim otomatis via httpOnly cookie.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Access token baru berhasil diterbitkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     access_token: { type: string }
 *                     expires_in:   { type: integer, example: 900 }
 *       401:
 *         description: Refresh token tidak valid, sudah direvoke, atau expired
 */
router.post('/refresh', authController.refresh)

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout dan revoke refresh token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout berhasil, refresh token direvoke
 *       401:
 *         description: Tidak terautentikasi
 */
router.post('/logout', authenticate, authController.logout)

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Ambil profil user yang sedang login
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data profil user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:          { type: string, format: uuid }
 *                     username:    { type: string }
 *                     email:       { type: string }
 *                     full_name:   { type: string, nullable: true }
 *                     roles:       { type: array, items: { type: string }, example: [BUYER, SELLER] }
 *                     active_role: { type: string, nullable: true, example: BUYER }
 *                     wallet_balance:   { type: number, nullable: true, example: 1000000 }
 *                     seller_income:    { type: number, nullable: true }
 *                     driver_earnings:  { type: number, nullable: true }
 */
router.get('/me', authenticate, authController.me)
```

---

### Group: Public Catalog

```typescript
/**
 * @swagger
 * tags:
 *   - name: Public
 *     description: Endpoint publik (tidak perlu login)
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Daftar produk (catalog publik)
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *       - in: query
 *         name: search
 *         description: Cari berdasarkan nama atau deskripsi
 *         schema: { type: string }
 *       - in: query
 *         name: store_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: min_price
 *         schema: { type: number }
 *       - in: query
 *         name: max_price
 *         schema: { type: number }
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, price_asc, price_desc]
 *           default: newest
 *     responses:
 *       200:
 *         description: Daftar produk berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/products', validateQuery(GetProductsQuerySchema), publicController.getProducts)
```

---

### Group: Buyer — Checkout (Contoh Paling Kompleks)

```typescript
/**
 * @swagger
 * tags:
 *   - name: Buyer - Checkout
 *     description: Keranjang, checkout, dan pesanan buyer
 */

/**
 * @swagger
 * /buyer/cart:
 *   post:
 *     summary: Tambah produk ke keranjang
 *     description: |
 *       **Single-Store Rule:** Keranjang hanya bisa berisi produk dari satu toko.
 *       Jika menambahkan produk dari toko berbeda, akan mengembalikan error 409.
 *     tags: [Buyer - Checkout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, quantity]
 *             properties:
 *               product_id:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 999
 *                 example: 2
 *     responses:
 *       200:
 *         description: Produk berhasil ditambahkan ke keranjang
 *       400:
 *         description: Stok tidak mencukupi atau produk tidak ditemukan
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan BUYER
 *       409:
 *         description: |
 *           Produk dari toko berbeda (single-store rule violated).
 *           Response body berisi informasi toko yang konflik.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 message:
 *                   type: string
 *                   example: "Keranjang sudah berisi produk dari 'Toko A'. Kosongkan keranjang terlebih dahulu."
 *                 data:
 *                   type: object
 *                   properties:
 *                     current_store:
 *                       type: object
 *                       properties:
 *                         id:   { type: string, format: uuid }
 *                         name: { type: string, example: Toko A }
 *                     requested_store:
 *                       type: object
 *                       properties:
 *                         id:   { type: string, format: uuid }
 *                         name: { type: string, example: Toko B }
 */
router.post('/cart', authenticate, requireRole('BUYER'), validateBody(AddToCartSchema), buyerController.addToCart)

/**
 * @swagger
 * /buyer/checkout/preview:
 *   post:
 *     summary: Preview kalkulasi harga sebelum checkout
 *     description: |
 *       Mengembalikan breakdown harga tanpa membuat pesanan.
 *       Gunakan endpoint ini untuk menampilkan rincian biaya di halaman checkout.
 *
 *       **Formula harga:**
 *       ```
 *       subtotal = Σ(price × qty)
 *       discount = apply_discount(code, subtotal)
 *       tax_base = (subtotal - discount) + delivery_fee
 *       ppn_12   = round(tax_base × 0.12)
 *       total    = tax_base + ppn_12
 *       ```
 *     tags: [Buyer - Checkout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [address_id, delivery_method]
 *             properties:
 *               address_id:
 *                 type: string
 *                 format: uuid
 *               delivery_method:
 *                 type: string
 *                 enum: [INSTANT, NEXT_DAY, REGULAR]
 *                 description: "INSTANT=Rp15.000 | NEXT_DAY=Rp10.000 | REGULAR=Rp6.000"
 *               discount_code:
 *                 type: string
 *                 example: HEMAT10
 *     responses:
 *       200:
 *         description: Kalkulasi harga berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     subtotal:           { type: number, example: 300000 }
 *                     discount_amount:    { type: number, example: 30000 }
 *                     discount_code:      { type: string, example: HEMAT10, nullable: true }
 *                     discount_type:      { type: string, example: VOUCHER, nullable: true }
 *                     delivery_fee:       { type: number, example: 6000 }
 *                     ppn_amount:         { type: number, example: 33120 }
 *                     final_total:        { type: number, example: 309120 }
 *                     wallet_balance:     { type: number, example: 1500000 }
 *                     is_balance_enough:  { type: boolean, example: true }
 */
router.post('/checkout/preview', authenticate, requireRole('BUYER'), validateBody(CheckoutSchema), buyerController.previewCheckout)

/**
 * @swagger
 * /buyer/checkout:
 *   post:
 *     summary: Buat pesanan (checkout)
 *     description: |
 *       Memproses checkout secara atomik dalam satu database transaction:
 *       1. Validasi keranjang dan stok
 *       2. Validasi kode diskon (jika ada)
 *       3. Hitung total harga
 *       4. Validasi saldo dompet
 *       5. Potong saldo dompet
 *       6. Kurangi stok produk
 *       7. Buat record pesanan
 *       8. Catat penggunaan voucher (jika ada)
 *       9. Kosongkan keranjang
 *
 *       Jika salah satu langkah gagal, seluruh proses dibatalkan (rollback).
 *     tags: [Buyer - Checkout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [address_id, delivery_method]
 *             properties:
 *               address_id:
 *                 type: string
 *                 format: uuid
 *               delivery_method:
 *                 type: string
 *                 enum: [INSTANT, NEXT_DAY, REGULAR]
 *               discount_code:
 *                 type: string
 *                 example: HEMAT10
 *     responses:
 *       201:
 *         description: Pesanan berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Pesanan berhasil dibuat }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:              { type: string, format: uuid }
 *                     status:          { type: string, example: SEDANG_DIKEMAS }
 *                     subtotal:        { type: number, example: 300000 }
 *                     discount_amount: { type: number, example: 30000 }
 *                     delivery_fee:    { type: number, example: 6000 }
 *                     ppn_amount:      { type: number, example: 33120 }
 *                     final_total:     { type: number, example: 309120 }
 *                     created_at:      { type: string, format: date-time }
 *       400:
 *         description: |
 *           Berbagai error validasi:
 *           - Keranjang kosong
 *           - Stok tidak mencukupi
 *           - Saldo tidak cukup
 *           - Kode diskon tidak valid/expired/habis
 *       403:
 *         description: Active role bukan BUYER
 */
router.post('/checkout', authenticate, requireRole('BUYER'), validateBody(CheckoutSchema), buyerController.checkout)
```

---

### Group: Admin — Voucher

```typescript
/**
 * @swagger
 * /admin/vouchers:
 *   post:
 *     summary: Buat voucher baru
 *     tags: [Admin - Discounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, discount_type, discount_value, expiry_date, max_usage]
 *             properties:
 *               code:
 *                 type: string
 *                 example: HEMAT10
 *                 description: Kode voucher (otomatis diubah ke uppercase)
 *               discount_type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED_AMOUNT]
 *               discount_value:
 *                 type: number
 *                 example: 10
 *                 description: Nilai diskon (persen jika PERCENTAGE, Rupiah jika FIXED_AMOUNT)
 *               max_discount_amount:
 *                 type: number
 *                 example: 50000
 *                 description: Batas maksimal diskon (untuk PERCENTAGE, opsional)
 *               min_order_amount:
 *                 type: number
 *                 example: 100000
 *                 description: Minimal order untuk bisa menggunakan voucher
 *               expiry_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-12-31T23:59:59Z"
 *               max_usage:
 *                 type: integer
 *                 example: 100
 *               is_active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Voucher berhasil dibuat
 *       400:
 *         description: Data tidak valid
 *       403:
 *         description: Bukan Admin
 *       409:
 *         description: Kode voucher sudah ada
 */
router.post('/vouchers', authenticate, requireRole('ADMIN'), validateBody(CreateVoucherSchema), adminController.createVoucher)
```

---

## 4. Tags yang Digunakan

Daftar semua tag (untuk konsistensi grouping di Swagger UI):

```typescript
// Deklarasikan di atas setiap route file:

/**
 * @swagger
 * tags:
 *   - name: Auth
 *   - name: Public
 *   - name: Reviews
 *   - name: Buyer - Wallet
 *   - name: Buyer - Addresses
 *   - name: Buyer - Cart
 *   - name: Buyer - Checkout
 *   - name: Buyer - Reports
 *   - name: Seller - Store
 *   - name: Seller - Products
 *   - name: Seller - Orders
 *   - name: Seller - Reports
 *   - name: Driver - Jobs
 *   - name: Driver - Earnings
 *   - name: Admin - Dashboard
 *   - name: Admin - Users
 *   - name: Admin - Stores
 *   - name: Admin - Products
 *   - name: Admin - Orders
 *   - name: Vouchers & Promos
 *   - name: Admin - Overdue
 */
```

---

## 5. Response Status Code yang Wajib Didokumentasikan

Setiap endpoint HARUS mendokumentasikan response berikut (sesuai yang applicable):

| Code | Kapan Muncul | Wajib Didokumentasikan? |
|------|-------------|------------------------|
| 200 | GET berhasil, POST/PUT non-create berhasil | ✅ Selalu |
| 201 | POST create berhasil | ✅ Selalu |
| 204 | DELETE berhasil | ✅ Selalu |
| 400 | Validasi gagal | ✅ Selalu |
| 401 | Tidak ada/invalid token | ✅ Jika endpoint butuh auth |
| 403 | Role salah / bukan pemilik | ✅ Jika ada role check |
| 404 | Resource tidak ditemukan | ✅ Jika ada path param |
| 409 | Konflik (duplicate, business rule) | ✅ Jika ada potensi konflik |
| 500 | Error server | Tidak perlu (sudah implisit) |
