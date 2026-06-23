import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import { validateBody } from '../middleware/validate'
import { RegisterSchema, LoginSchema, SelectRoleSchema } from '../schemas/auth.schema'
import * as authController from '../controllers/auth.controller'

const router = Router()

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
 *               phone:
 *                 type: string
 *                 example: "081234567890"
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
 *               example: seapedia_refresh_token=xxx; HttpOnly; SameSite=Strict
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
 *       401:
 *         description: Tidak terautentikasi
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
 *       401:
 *         description: Tidak terautentikasi
 */
router.get('/me', authenticate, authController.me)

export default router
