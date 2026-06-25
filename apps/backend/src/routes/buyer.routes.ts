import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import { requireRole } from '../middleware/requireRole'
import { validateBody, validateQuery } from '../middleware/validate'
import { TopUpSchema, CreateAddressSchema, UpdateAddressSchema } from '../schemas/buyer.schema'
import { AddToCartSchema, UpdateCartItemSchema } from '../schemas/cart.schema'
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
 *   - name: Buyer - Cart
 *     description: Keranjang belanja pembeli (aturan single-store)
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

/**
 * @swagger
 * /buyer/cart:
 *   get:
 *     summary: Ambil ringkasan keranjang belanja
 *     description: |
 *       Mengembalikan item keranjang, informasi toko (karena keranjang hanya
 *       boleh berisi produk dari satu toko), dan subtotal mentah (sebelum
 *       diskon/ongkir/PPN).
 *     tags: [Buyer - Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ringkasan keranjang berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     store:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:   { type: string, format: uuid }
 *                         name: { type: string, example: Toko Elektronik Maju }
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:             { type: string, format: uuid }
 *                           product_id:     { type: string, format: uuid }
 *                           product_name:   { type: string }
 *                           product_price:  { type: number }
 *                           product_stock:  { type: integer }
 *                           quantity:       { type: integer }
 *                           subtotal:       { type: number }
 *                     subtotal: { type: number, example: 375000 }
 *       400:
 *         description: Akun tidak memiliki profil pembeli
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan BUYER
 */
router.get('/cart', authenticate, requireRole('BUYER'), buyerController.getCart)

/**
 * @swagger
 * /buyer/cart:
 *   post:
 *     summary: Tambah produk ke keranjang
 *     description: |
 *       **Single-Store Rule:** Keranjang hanya bisa berisi produk dari satu toko.
 *       Jika keranjang sudah berisi produk dari toko lain, request ini akan
 *       ditolak dengan status 409 dan `data.current_store` / `data.requested_store`
 *       berisi info kedua toko yang konflik — frontend menggunakan ini untuk
 *       menampilkan dialog konfirmasi.
 *
 *       Jika produk yang sama sudah ada di keranjang, jumlah akan ditambahkan
 *       (di-cap pada stok produk). Kuantitas yang diminta tidak boleh melebihi stok.
 *     tags: [Buyer - Cart]
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
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 999
 *                 example: 2
 *     responses:
 *       200:
 *         description: Produk berhasil ditambahkan ke keranjang
 *       400:
 *         description: Stok tidak mencukupi, atau akun tidak memiliki profil pembeli
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan BUYER
 *       404:
 *         description: Produk tidak ditemukan
 *       409:
 *         description: |
 *           Produk dari toko berbeda (single-store rule violated).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 message:
 *                   type: string
 *                   example: "Keranjangmu sudah berisi produk dari 'Toko A'. Kosongkan keranjang terlebih dahulu untuk membeli dari toko lain."
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
router.post(
  '/cart',
  authenticate,
  requireRole('BUYER'),
  validateBody(AddToCartSchema),
  buyerController.addToCart
)

/**
 * @swagger
 * /buyer/cart/{itemId}:
 *   put:
 *     summary: Perbarui jumlah item di keranjang
 *     tags: [Buyer - Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 999
 *     responses:
 *       200:
 *         description: Jumlah produk berhasil diperbarui
 *       400:
 *         description: Stok tidak mencukupi
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan BUYER
 *       404:
 *         description: Item keranjang tidak ditemukan atau bukan milik pembeli ini
 */
router.put(
  '/cart/:itemId',
  authenticate,
  requireRole('BUYER'),
  validateBody(UpdateCartItemSchema),
  buyerController.updateCartItem
)

/**
 * @swagger
 * /buyer/cart/{itemId}:
 *   delete:
 *     summary: Hapus item dari keranjang
 *     tags: [Buyer - Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Item berhasil dihapus, mengembalikan ringkasan keranjang terbaru
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan BUYER
 *       404:
 *         description: Item keranjang tidak ditemukan atau bukan milik pembeli ini
 */
router.delete('/cart/:itemId', authenticate, requireRole('BUYER'), buyerController.removeCartItem)

/**
 * @swagger
 * /buyer/cart:
 *   delete:
 *     summary: Kosongkan seluruh keranjang
 *     tags: [Buyer - Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Keranjang berhasil dikosongkan
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Active role bukan BUYER
 */
router.delete('/cart', authenticate, requireRole('BUYER'), buyerController.clearCart)

export default router
