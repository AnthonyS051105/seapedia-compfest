import { Router } from 'express'
import { validateBody, validateQuery } from '../middleware/validate'
import { GetProductsQuerySchema } from '../schemas/product.schema'
import { CreateReviewSchema, GetReviewsQuerySchema } from '../schemas/review.schema'
import { ValidateDiscountCodeQuerySchema } from '../schemas/discount.schema'
import { paginationSchema } from '../schemas/utils'
import * as publicController from '../controllers/public.controller'

const router = Router()

/**
 * @swagger
 * tags:
 *   - name: Public
 *     description: Endpoint publik (tidak perlu login)
 *   - name: Reviews
 *     description: Ulasan aplikasi (publik, tidak perlu login)
 *   - name: Vouchers & Promos
 *     description: Validasi kode diskon (publik)
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
 *       400:
 *         description: Parameter query tidak valid
 */
router.get('/products', validateQuery(GetProductsQuerySchema), publicController.getProducts)

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Detail produk
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Detail produk berhasil diambil
 *       404:
 *         description: Produk tidak ditemukan atau sudah dihapus
 */
router.get('/products/:id', publicController.getProductById)

/**
 * @swagger
 * /stores:
 *   get:
 *     summary: Daftar toko aktif
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *     responses:
 *       200:
 *         description: Daftar toko berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/stores', validateQuery(paginationSchema), publicController.getStores)

/**
 * @swagger
 * /stores/{id}:
 *   get:
 *     summary: Detail toko beserta daftar produknya
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *     responses:
 *       200:
 *         description: Detail toko berhasil diambil
 *       404:
 *         description: Toko tidak ditemukan
 */
router.get('/stores/:id', validateQuery(paginationSchema), publicController.getStoreById)

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Kirim review aplikasi
 *     description: |
 *       Tidak memerlukan login atau riwayat transaksi.
 *       `reviewer_name` dan `comment` di-sanitasi (strip semua tag HTML) sebelum disimpan
 *       untuk mencegah XSS.
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reviewer_name, rating, comment]
 *             properties:
 *               reviewer_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: Tester Satu
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comment:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 example: Marketplace yang bagus!
 *     responses:
 *       201:
 *         description: Review berhasil dikirim
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Review berhasil dikirim }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:            { type: string, format: uuid }
 *                     reviewer_name: { type: string, example: Tester Satu }
 *                     rating:        { type: integer, example: 4 }
 *                     comment:       { type: string, example: Marketplace yang bagus! }
 *                     created_at:    { type: string, format: date-time }
 *       400:
 *         description: Validasi gagal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/reviews', validateBody(CreateReviewSchema), publicController.createReview)

/**
 * @swagger
 * /reviews:
 *   get:
 *     summary: Daftar review aplikasi
 *     description: Diurutkan berdasarkan created_at DESC.
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *     responses:
 *       200:
 *         description: Daftar review berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/reviews', validateQuery(GetReviewsQuerySchema), publicController.getReviews)

/**
 * @swagger
 * /vouchers/validate:
 *   get:
 *     summary: Validasi kode voucher atau promo
 *     description: |
 *       Memeriksa apakah kode diskon (voucher atau promo) valid untuk digunakan:
 *       tidak kadaluarsa, kuota pemakaian masih tersedia (khusus voucher), aktif,
 *       dan subtotal memenuhi syarat minimal order (jika ada).
 *     tags: [Vouchers & Promos]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema: { type: string, example: HEMAT10 }
 *       - in: query
 *         name: subtotal
 *         schema: { type: number, default: 0, example: 300000 }
 *         description: Subtotal keranjang untuk menghitung estimasi nilai diskon
 *     responses:
 *       200:
 *         description: Kode diskon valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     type:                { type: string, enum: [VOUCHER, PROMO] }
 *                     id:                  { type: string, format: uuid }
 *                     code:                { type: string, example: HEMAT10 }
 *                     discount_type:       { type: string, enum: [PERCENTAGE, FIXED_AMOUNT] }
 *                     discount_value:      { type: number, example: 10 }
 *                     max_discount_amount: { type: number, nullable: true }
 *                     min_order_amount:    { type: number, nullable: true }
 *                     expiry_date:         { type: string, format: date-time }
 *                     is_valid:            { type: boolean, example: true }
 *                     discount_amount:     { type: number, example: 30000 }
 *       400:
 *         description: |
 *           Kode tidak valid, kadaluarsa, kuota habis, tidak aktif, atau subtotal
 *           tidak memenuhi minimal order
 *       404:
 *         description: Kode diskon tidak ditemukan
 */
router.get(
  '/vouchers/validate',
  validateQuery(ValidateDiscountCodeQuerySchema),
  publicController.validateDiscountCode
)

export default router
