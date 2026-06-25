import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import { requireRole } from '../middleware/requireRole'
import { validateBody, validateQuery } from '../middleware/validate'
import {
  CreateVoucherSchema,
  CreatePromoSchema,
  GetDiscountsQuerySchema,
} from '../schemas/discount.schema'
import * as adminController from '../controllers/admin.controller'

const router = Router()

router.use(authenticate, requireRole('ADMIN'))

/**
 * @swagger
 * tags:
 *   - name: Admin - Discounts
 *     description: Manajemen voucher dan promo (Admin only)
 */

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
 *                 description: Nilai diskon (persen 1-100 jika PERCENTAGE, Rupiah jika FIXED_AMOUNT)
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
 *                 example: "2026-12-31T23:59:59Z"
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
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Bukan Admin
 *       409:
 *         description: Kode voucher sudah ada
 */
router.post('/vouchers', validateBody(CreateVoucherSchema), adminController.createVoucher)

/**
 * @swagger
 * /admin/vouchers:
 *   get:
 *     summary: Daftar voucher
 *     tags: [Admin - Discounts]
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
 *         name: is_active
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Daftar voucher berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Bukan Admin
 */
router.get('/vouchers', validateQuery(GetDiscountsQuerySchema), adminController.getVouchers)

/**
 * @swagger
 * /admin/vouchers/{id}:
 *   get:
 *     summary: Detail voucher
 *     tags: [Admin - Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Detail voucher berhasil diambil
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Bukan Admin
 *       404:
 *         description: Voucher tidak ditemukan
 */
router.get('/vouchers/:id', adminController.getVoucherById)

/**
 * @swagger
 * /admin/promos:
 *   post:
 *     summary: Buat promo baru
 *     description: Promo tidak memiliki batas penggunaan (tidak seperti voucher).
 *     tags: [Admin - Discounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name, discount_type, discount_value, expiry_date]
 *             properties:
 *               code:
 *                 type: string
 *                 example: PROMO15
 *               name:
 *                 type: string
 *                 example: Promo Spesial 17an
 *               description:
 *                 type: string
 *               discount_type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED_AMOUNT]
 *               discount_value:
 *                 type: number
 *                 example: 15
 *               max_discount_amount:
 *                 type: number
 *               min_order_amount:
 *                 type: number
 *               expiry_date:
 *                 type: string
 *                 format: date-time
 *               is_active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Promo berhasil dibuat
 *       400:
 *         description: Data tidak valid
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Bukan Admin
 *       409:
 *         description: Kode promo sudah ada
 */
router.post('/promos', validateBody(CreatePromoSchema), adminController.createPromo)

/**
 * @swagger
 * /admin/promos:
 *   get:
 *     summary: Daftar promo
 *     tags: [Admin - Discounts]
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
 *         name: is_active
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Daftar promo berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Bukan Admin
 */
router.get('/promos', validateQuery(GetDiscountsQuerySchema), adminController.getPromos)

/**
 * @swagger
 * /admin/promos/{id}:
 *   get:
 *     summary: Detail promo
 *     tags: [Admin - Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Detail promo berhasil diambil
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Bukan Admin
 *       404:
 *         description: Promo tidak ditemukan
 */
router.get('/promos/:id', adminController.getPromoById)

/**
 * @swagger
 * tags:
 *   - name: Admin - Overdue
 *     description: Simulasi waktu dan pemrosesan pesanan overdue (Admin only)
 */

/**
 * @swagger
 * /admin/simulate-next-day:
 *   post:
 *     summary: Majukan tanggal sistem 1 hari dan proses pesanan overdue
 *     description: |
 *       Menambah `system_date_offset` sebanyak 1 hari, lalu menjalankan
 *       pemrosesan overdue untuk semua pesanan yang melewati SLA pengiriman.
 *       Setiap pesanan overdue di-refund secara atomik (saldo dikembalikan,
 *       stok dipulihkan, status menjadi DIKEMBALIKAN) dan ditandai
 *       `is_overdue_processed = true` agar tidak diproses dua kali.
 *     tags: [Admin - Overdue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Simulasi berhasil dijalankan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     new_offset:      { type: integer, example: 1 }
 *                     processed_count: { type: integer, example: 2 }
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Bukan Admin
 */
router.post('/simulate-next-day', adminController.simulateNextDay)

/**
 * @swagger
 * /admin/process-overdue:
 *   post:
 *     summary: Jalankan pemrosesan overdue secara manual
 *     description: |
 *       Memicu pemrosesan overdue tanpa memajukan tanggal sistem.
 *       Berguna untuk memproses ulang setelah perubahan data tanpa
 *       mengubah offset hari simulasi.
 *     tags: [Admin - Overdue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pemrosesan overdue selesai
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     processed_count: { type: integer, example: 0 }
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Bukan Admin
 */
router.post('/process-overdue', adminController.processOverdue)

export default router
