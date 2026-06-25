import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import { requireRole } from '../middleware/requireRole'
import { validateBody, validateQuery } from '../middleware/validate'
import { TopUpSchema, CreateAddressSchema, UpdateAddressSchema } from '../schemas/buyer.schema'
import { paginationSchema } from '../schemas/utils'
import * as buyerController from '../controllers/buyer.controller'

const router = Router()

/**
 * @swagger
 * tags:
 *   - name: Buyer - Wallet
 *     description: Dompet dan top up saldo pembeli
 *   - name: Buyer - Addresses
 *     description: Manajemen alamat pengiriman pembeli
 */

/**
 * @swagger
 * /buyer/wallet:
 *   get:
 *     summary: Ambil saldo dompet dan riwayat transaksi
 *     tags: [Buyer - Wallet]
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
 *         description: Saldo dan riwayat transaksi berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance: { type: number, example: 1000000 }
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:          { type: string, format: uuid }
 *                           type:        { type: string, enum: [TOP_UP, PAYMENT, REFUND] }
 *                           amount:      { type: number, example: 500000 }
 *                           description: { type: string, nullable: true }
 *                           order_id:    { type: string, nullable: true }
 *                           created_at:  { type: string, format: date-time }
 *                     meta:
 *                       type: object
 *                       properties:
 *                         page:       { type: integer }
 *                         limit:      { type: integer }
 *                         total:      { type: integer }
 *                         totalPages: { type: integer }
 *       400:
 *         description: Akun tidak memiliki profil pembeli
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan BUYER
 */
router.get(
  '/wallet',
  authenticate,
  requireRole('BUYER'),
  validateQuery(paginationSchema),
  buyerController.getWallet
)

/**
 * @swagger
 * /buyer/wallet/topup:
 *   post:
 *     summary: Top up saldo dompet pembeli
 *     description: |
 *       Top up dummy (tidak ada payment gateway nyata). Saldo bertambah langsung
 *       dan dicatat sebagai transaksi tipe `TOP_UP`. Operasi ini berjalan dalam
 *       satu Prisma `$transaction()`.
 *     tags: [Buyer - Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: integer
 *                 minimum: 10000
 *                 maximum: 10000000
 *                 example: 500000
 *     responses:
 *       200:
 *         description: Top up berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Top up berhasil }
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance: { type: number, example: 1500000 }
 *                     transaction:
 *                       type: object
 *                       properties:
 *                         id:          { type: string, format: uuid }
 *                         type:        { type: string, example: TOP_UP }
 *                         amount:      { type: number, example: 500000 }
 *                         description: { type: string, nullable: true }
 *                         order_id:    { type: string, nullable: true }
 *                         created_at:  { type: string, format: date-time }
 *       400:
 *         description: Validasi gagal (jumlah di luar rentang) atau akun tidak memiliki profil pembeli
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan BUYER
 */
router.post(
  '/wallet/topup',
  authenticate,
  requireRole('BUYER'),
  validateBody(TopUpSchema),
  buyerController.topUp
)

/**
 * @swagger
 * /buyer/addresses:
 *   get:
 *     summary: Daftar alamat pengiriman milik sendiri
 *     tags: [Buyer - Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar alamat berhasil diambil
 *       400:
 *         description: Akun tidak memiliki profil pembeli
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan BUYER
 */
router.get('/addresses', authenticate, requireRole('BUYER'), buyerController.getAddresses)

/**
 * @swagger
 * /buyer/addresses:
 *   post:
 *     summary: Tambah alamat pengiriman baru
 *     description: |
 *       Jika `is_default` bernilai `true`, alamat default sebelumnya akan
 *       di-unset terlebih dahulu (dalam satu Prisma `$transaction()`).
 *     tags: [Buyer - Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [label, recipient_name, phone, street, city, province, postal_code]
 *             properties:
 *               label:          { type: string, example: Rumah }
 *               recipient_name: { type: string, example: Budi Santoso }
 *               phone:          { type: string, example: "081234567890" }
 *               street:         { type: string, example: Jl. Merdeka No. 10 }
 *               city:           { type: string, example: Jakarta Selatan }
 *               province:       { type: string, example: DKI Jakarta }
 *               postal_code:    { type: string, example: "12345" }
 *               is_default:     { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: Alamat berhasil ditambahkan
 *       400:
 *         description: Validasi gagal atau akun tidak memiliki profil pembeli
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan BUYER
 */
router.post(
  '/addresses',
  authenticate,
  requireRole('BUYER'),
  validateBody(CreateAddressSchema),
  buyerController.createAddress
)

/**
 * @swagger
 * /buyer/addresses/{id}:
 *   put:
 *     summary: Perbarui alamat milik sendiri
 *     tags: [Buyer - Addresses]
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
 *               label:          { type: string }
 *               recipient_name: { type: string }
 *               phone:          { type: string }
 *               street:         { type: string }
 *               city:           { type: string }
 *               province:       { type: string }
 *               postal_code:    { type: string }
 *               is_default:     { type: boolean }
 *     responses:
 *       200:
 *         description: Alamat berhasil diperbarui
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan BUYER
 *       404:
 *         description: Alamat tidak ditemukan atau bukan milik pembeli ini
 */
router.put(
  '/addresses/:id',
  authenticate,
  requireRole('BUYER'),
  validateBody(UpdateAddressSchema),
  buyerController.updateAddress
)

/**
 * @swagger
 * /buyer/addresses/{id}:
 *   delete:
 *     summary: Hapus alamat milik sendiri
 *     description: Alamat tidak dapat dihapus jika sudah dirujuk oleh pesanan.
 *     tags: [Buyer - Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Alamat berhasil dihapus
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan BUYER
 *       404:
 *         description: Alamat tidak ditemukan atau bukan milik pembeli ini
 *       409:
 *         description: Alamat sudah digunakan pada pesanan dan tidak dapat dihapus
 */
router.delete('/addresses/:id', authenticate, requireRole('BUYER'), buyerController.deleteAddress)

/**
 * @swagger
 * /buyer/addresses/{id}/default:
 *   put:
 *     summary: Jadikan alamat ini sebagai alamat default
 *     description: Alamat default sebelumnya akan di-unset (dalam satu Prisma `$transaction()`).
 *     tags: [Buyer - Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Alamat default berhasil diperbarui
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan BUYER
 *       404:
 *         description: Alamat tidak ditemukan atau bukan milik pembeli ini
 */
router.put('/addresses/:id/default', authenticate, requireRole('BUYER'), buyerController.setDefaultAddress)

export default router
