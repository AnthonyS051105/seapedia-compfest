import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import { requireRole } from '../middleware/requireRole'
import { validateBody, validateQuery } from '../middleware/validate'
import { CreateStoreSchema, UpdateStoreSchema } from '../schemas/store.schema'
import { CreateProductSchema, UpdateProductSchema } from '../schemas/product.schema'
import { GetOrdersQuerySchema, GetIncomeReportQuerySchema } from '../schemas/order.schema'
import { paginationSchema } from '../schemas/utils'
import * as sellerController from '../controllers/seller.controller'

const router = Router()

/**
 * @swagger
 * tags:
 *   - name: Seller - Store
 *     description: Manajemen toko penjual
 *   - name: Seller - Products
 *     description: Manajemen produk penjual
 *   - name: Seller - Orders
 *     description: Pesanan masuk untuk toko penjual
 *   - name: Seller - Reports
 *     description: Laporan pendapatan penjual
 */

/**
 * @swagger
 * /seller/store:
 *   post:
 *     summary: Buat toko baru
 *     description: |
 *       Setiap penjual hanya boleh memiliki 1 toko. Nama toko harus unik (case-insensitive)
 *       secara global.
 *     tags: [Seller - Store]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 example: Toko Elektronik Maju
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               address:
 *                 type: string
 *                 maxLength: 500
 *               logo_url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Toko berhasil dibuat
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan SELLER
 *       409:
 *         description: Penjual sudah memiliki toko, atau nama toko sudah digunakan
 */
router.post(
  '/store',
  authenticate,
  requireRole('SELLER'),
  validateBody(CreateStoreSchema),
  sellerController.createStore
)

/**
 * @swagger
 * /seller/store:
 *   get:
 *     summary: Ambil detail toko milik penjual yang sedang login
 *     tags: [Seller - Store]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: |
 *           Detail toko berhasil diambil. `data` bernilai `null` jika penjual belum
 *           memiliki toko.
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan SELLER
 */
router.get('/store', authenticate, requireRole('SELLER'), sellerController.getMyStore)

/**
 * @swagger
 * /seller/store:
 *   put:
 *     summary: Perbarui profil toko milik sendiri
 *     tags: [Seller - Store]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               address:
 *                 type: string
 *                 maxLength: 500
 *               logo_url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Toko berhasil diperbarui
 *       400:
 *         description: Validasi gagal, atau toko belum dibuat
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan SELLER
 *       404:
 *         description: Toko tidak ditemukan
 *       409:
 *         description: Nama toko sudah digunakan
 */
router.put(
  '/store',
  authenticate,
  requireRole('SELLER'),
  validateBody(UpdateStoreSchema),
  sellerController.updateStore
)

/**
 * @swagger
 * /seller/products:
 *   post:
 *     summary: Buat produk baru
 *     description: Penjual harus memiliki toko sebelum bisa menambahkan produk.
 *     tags: [Seller - Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, stock]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *                 example: Headphone Wireless
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               price:
 *                 type: number
 *                 example: 250000
 *               stock:
 *                 type: integer
 *                 example: 15
 *               images:
 *                 type: array
 *                 items: { type: string, format: uri }
 *                 maxItems: 5
 *               category:
 *                 type: string
 *                 maxLength: 50
 *     responses:
 *       201:
 *         description: Produk berhasil dibuat
 *       400:
 *         description: Validasi gagal, atau penjual belum memiliki toko
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan SELLER
 */
router.post(
  '/products',
  authenticate,
  requireRole('SELLER'),
  validateBody(CreateProductSchema),
  sellerController.createProduct
)

/**
 * @swagger
 * /seller/products:
 *   get:
 *     summary: Daftar produk milik toko sendiri
 *     tags: [Seller - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *     responses:
 *       200:
 *         description: Daftar produk berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       400:
 *         description: Penjual belum memiliki toko
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan SELLER
 */
router.get(
  '/products',
  authenticate,
  requireRole('SELLER'),
  validateQuery(paginationSchema),
  sellerController.getMyProducts
)

/**
 * @swagger
 * /seller/products/{id}:
 *   get:
 *     summary: Detail produk milik sendiri
 *     tags: [Seller - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Detail produk berhasil diambil
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan SELLER
 *       404:
 *         description: Produk tidak ditemukan atau bukan milik penjual ini
 */
router.get('/products/:id', authenticate, requireRole('SELLER'), sellerController.getProductById)

/**
 * @swagger
 * /seller/products/{id}:
 *   put:
 *     summary: Perbarui produk milik sendiri
 *     tags: [Seller - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               images:
 *                 type: array
 *                 items: { type: string, format: uri }
 *                 maxItems: 5
 *               category:
 *                 type: string
 *                 maxLength: 50
 *     responses:
 *       200:
 *         description: Produk berhasil diperbarui
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan SELLER
 *       404:
 *         description: Produk tidak ditemukan atau bukan milik penjual ini
 */
router.put(
  '/products/:id',
  authenticate,
  requireRole('SELLER'),
  validateBody(UpdateProductSchema),
  sellerController.updateProduct
)

/**
 * @swagger
 * /seller/products/{id}:
 *   delete:
 *     summary: Hapus produk milik sendiri (soft delete)
 *     description: Produk tidak dihapus permanen — `deleted_at` di-set agar riwayat pesanan tetap valid.
 *     tags: [Seller - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Produk berhasil dihapus
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan SELLER
 *       404:
 *         description: Produk tidak ditemukan atau bukan milik penjual ini
 */
router.delete('/products/:id', authenticate, requireRole('SELLER'), sellerController.deleteProduct)

/**
 * @swagger
 * /seller/orders:
 *   get:
 *     summary: Daftar pesanan masuk untuk toko sendiri
 *     tags: [Seller - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SEDANG_DIKEMAS, MENUNGGU_PENGIRIM, SEDANG_DIKIRIM, PESANAN_SELESAI, DIKEMBALIKAN]
 *     responses:
 *       200:
 *         description: Daftar pesanan berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       400:
 *         description: Penjual belum memiliki toko
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan SELLER
 */
router.get(
  '/orders',
  authenticate,
  requireRole('SELLER'),
  validateQuery(GetOrdersQuerySchema),
  sellerController.getIncomingOrders
)

/**
 * @swagger
 * /seller/orders/{id}:
 *   get:
 *     summary: Detail pesanan (item + riwayat status) untuk toko sendiri
 *     tags: [Seller - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Detail pesanan berhasil diambil
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan SELLER
 *       404:
 *         description: Pesanan tidak ditemukan atau bukan milik toko ini
 */
router.get('/orders/:id', authenticate, requireRole('SELLER'), sellerController.getOrderDetail)

/**
 * @swagger
 * /seller/orders/{id}/process:
 *   post:
 *     summary: Proses pesanan masuk
 *     description: |
 *       Mengubah status pesanan dari `SEDANG_DIKEMAS` ke `MENUNGGU_PENGIRIM`,
 *       mencatat perubahan ke riwayat status, dan membuat record `DeliveryJob`
 *       (belum diambil driver). Hanya bisa dilakukan jika status saat ini
 *       `SEDANG_DIKEMAS`.
 *     tags: [Seller - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Pesanan berhasil diproses
 *       400:
 *         description: Pesanan tidak dapat diproses dari status saat ini
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan SELLER
 *       404:
 *         description: Pesanan tidak ditemukan atau bukan milik toko ini
 */
router.post('/orders/:id/process', authenticate, requireRole('SELLER'), sellerController.processOrder)

/**
 * @swagger
 * /seller/reports/income:
 *   get:
 *     summary: Laporan pendapatan penjual
 *     description: |
 *       Menghitung total pendapatan dari pesanan dengan status `PESANAN_SELESAI` saja.
 *       Pesanan dengan status `DIKEMBALIKAN` (refund/overdue) tidak dihitung.
 *     tags: [Seller - Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from_date
 *         schema: { type: string, format: date-time }
 *         description: Filter pesanan dari tanggal ini (ISO 8601)
 *       - in: query
 *         name: to_date
 *         schema: { type: string, format: date-time }
 *         description: Filter pesanan sampai tanggal ini (ISO 8601)
 *     responses:
 *       200:
 *         description: Laporan pendapatan berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_income: { type: number, example: 1250000 }
 *                     order_count: { type: integer, example: 5 }
 *                     average_order_value: { type: number, example: 250000 }
 *                     from_date: { type: string, nullable: true }
 *                     to_date: { type: string, nullable: true }
 *                     period_breakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period: { type: string, example: "2025-06" }
 *                           order_count: { type: integer, example: 5 }
 *                           income: { type: number, example: 1250000 }
 *       400:
 *         description: Validasi gagal, atau penjual belum memiliki toko
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan SELLER
 */
router.get(
  '/reports/income',
  authenticate,
  requireRole('SELLER'),
  validateQuery(GetIncomeReportQuerySchema),
  sellerController.getIncomeReport
)

export default router
