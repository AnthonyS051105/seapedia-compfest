import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import { requireRole } from '../middleware/requireRole'
import { validateQuery } from '../middleware/validate'
import { GetDriverJobsQuerySchema, GetDriverEarningsQuerySchema } from '../schemas/driver.schema'
import * as driverController from '../controllers/driver.controller'

const router = Router()

/**
 * @swagger
 * tags:
 *   - name: Driver - Jobs
 *     description: Pekerjaan pengiriman untuk driver
 *   - name: Driver - Earnings
 *     description: Pendapatan driver
 */

/**
 * @swagger
 * /driver/jobs:
 *   get:
 *     summary: Daftar pekerjaan pengiriman yang tersedia
 *     description: |
 *       Hanya menampilkan `DeliveryJob` yang belum diambil driver manapun
 *       (`driver_id IS NULL`) dan pesanan terkait berstatus `MENUNGGU_PENGIRIM`.
 *     tags: [Driver - Jobs]
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
 *         description: Daftar pekerjaan tersedia berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan DRIVER
 */
router.get(
  '/jobs',
  authenticate,
  requireRole('DRIVER'),
  validateQuery(GetDriverJobsQuerySchema),
  driverController.getAvailableJobs
)

/**
 * @swagger
 * /driver/jobs/active:
 *   get:
 *     summary: Pekerjaan aktif milik driver yang sedang login
 *     description: Mengembalikan job dengan status pesanan `SEDANG_DIKIRIM` yang dimiliki driver ini, atau `null` jika tidak ada.
 *     tags: [Driver - Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pekerjaan aktif berhasil diambil (data bernilai null jika tidak ada pekerjaan aktif)
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan DRIVER
 */
router.get('/jobs/active', authenticate, requireRole('DRIVER'), driverController.getActiveJob)

/**
 * @swagger
 * /driver/jobs/history:
 *   get:
 *     summary: Riwayat pekerjaan yang telah diselesaikan driver
 *     tags: [Driver - Jobs]
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
 *         description: Riwayat pekerjaan berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan DRIVER
 */
router.get(
  '/jobs/history',
  authenticate,
  requireRole('DRIVER'),
  validateQuery(GetDriverJobsQuerySchema),
  driverController.getJobHistory
)

/**
 * @swagger
 * /driver/jobs/{id}:
 *   get:
 *     summary: Detail pekerjaan pengiriman
 *     description: |
 *       Bisa diakses jika job belum diambil driver manapun, atau jika job
 *       sudah diambil oleh driver yang sedang login. Mengembalikan 403 jika
 *       job sudah diambil driver lain.
 *     tags: [Driver - Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Detail pekerjaan berhasil diambil
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan DRIVER, atau pekerjaan sudah diambil driver lain
 *       404:
 *         description: Pekerjaan tidak ditemukan
 */
router.get('/jobs/:id', authenticate, requireRole('DRIVER'), driverController.getJobDetail)

/**
 * @swagger
 * /driver/jobs/{id}/take:
 *   post:
 *     summary: Ambil pekerjaan pengiriman
 *     description: |
 *       Menggunakan `SELECT ... FOR UPDATE SKIP LOCKED` di dalam database
 *       transaction untuk mencegah race condition — dua driver tidak bisa
 *       mengambil job yang sama secara bersamaan. Mengubah status pesanan
 *       dari `MENUNGGU_PENGIRIM` ke `SEDANG_DIKIRIM` dan mencatat riwayat status.
 *     tags: [Driver - Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Pekerjaan berhasil diambil
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan DRIVER
 *       404:
 *         description: Pekerjaan tidak ditemukan
 *       409:
 *         description: Pekerjaan sudah diambil driver lain
 */
router.post('/jobs/:id/take', authenticate, requireRole('DRIVER'), driverController.takeJob)

/**
 * @swagger
 * /driver/jobs/{id}/complete:
 *   post:
 *     summary: Konfirmasi pengiriman selesai
 *     description: |
 *       Hanya driver yang mengambil job ini yang bisa mengonfirmasi penyelesaian.
 *       Mengubah status pesanan dari `SEDANG_DIKIRIM` ke `PESANAN_SELESAI`,
 *       menghitung pendapatan driver (80% dari ongkos kirim), dan menambahkannya
 *       ke `DriverProfile.total_earnings`.
 *     tags: [Driver - Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Pengiriman berhasil dikonfirmasi selesai, pendapatan tercatat
 *       400:
 *         description: Pekerjaan tidak dapat diselesaikan dari status saat ini
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan DRIVER, atau pekerjaan bukan milik driver ini
 *       404:
 *         description: Pekerjaan tidak ditemukan
 */
router.post('/jobs/:id/complete', authenticate, requireRole('DRIVER'), driverController.completeJob)

/**
 * @swagger
 * /driver/earnings:
 *   get:
 *     summary: Ringkasan pendapatan driver
 *     description: Driver earnings rule — 80% dari ongkos kirim per pengiriman selesai.
 *     tags: [Driver - Earnings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from_date
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to_date
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Ringkasan pendapatan berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_earnings: { type: number, example: 48000 }
 *                     completed_jobs_count: { type: integer, example: 10 }
 *                     from_date: { type: string, nullable: true }
 *                     to_date: { type: string, nullable: true }
 *                     jobs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           job_id: { type: string, format: uuid }
 *                           order_id: { type: string, format: uuid }
 *                           delivery_method: { type: string, example: REGULAR }
 *                           earning: { type: number, example: 4800 }
 *                           completed_at: { type: string, format: date-time, nullable: true }
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan DRIVER
 */
router.get(
  '/earnings',
  authenticate,
  requireRole('DRIVER'),
  validateQuery(GetDriverEarningsQuerySchema),
  driverController.getEarnings
)

export default router
