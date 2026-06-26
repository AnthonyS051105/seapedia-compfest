import { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../prisma/client'
import { applyDiscount } from '../utils/pricing'
import { sanitizeText } from '../utils/sanitize'
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors'
import { CreateVoucherDto, CreatePromoDto, GetDiscountsQueryDto } from '../schemas/discount.schema'
import { PaginationMeta } from '../utils/response'

export type DiscountDb = PrismaClient | Prisma.TransactionClient

export interface DiscountCodeResult {
  type: 'VOUCHER' | 'PROMO'
  id: string
  code: string
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discount_value: number
  max_discount_amount: number | null
}

export interface ValidateDiscountResult extends DiscountCodeResult {
  is_valid: boolean
  discount_amount: number
  min_order_amount: number | null
  expiry_date: Date
}

export interface VoucherResult {
  id: string
  code: string
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discount_value: number
  max_discount_amount: number | null
  min_order_amount: number | null
  expiry_date: Date
  max_usage: number
  current_usage: number
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface PromoResult {
  id: string
  code: string
  name: string
  description: string | null
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discount_value: number
  max_discount_amount: number | null
  min_order_amount: number | null
  expiry_date: Date
  is_active: boolean
  created_at: Date
  updated_at: Date
}

interface VoucherRow {
  id: string
  code: string
  discount_type: string
  discount_value: Prisma.Decimal
  max_discount_amount: Prisma.Decimal | null
  min_order_amount: Prisma.Decimal | null
  expiry_date: Date
  max_usage: number
  current_usage: number
  is_active: boolean
  created_at: Date
  updated_at: Date
}

interface PromoRow {
  id: string
  code: string
  name: string
  description: string | null
  discount_type: string
  discount_value: Prisma.Decimal
  max_discount_amount: Prisma.Decimal | null
  min_order_amount: Prisma.Decimal | null
  expiry_date: Date
  is_active: boolean
  created_at: Date
  updated_at: Date
}

class DiscountService {
  async createVoucher(dto: CreateVoucherDto): Promise<VoucherResult> {
    const existing = await prisma.voucher.findUnique({ where: { code: dto.code } })
    if (existing) {
      throw new ConflictError('Kode voucher sudah digunakan')
    }
    const promoExisting = await prisma.promo.findUnique({ where: { code: dto.code } })
    if (promoExisting) {
      throw new ConflictError('Kode sudah digunakan oleh promo lain')
    }

    const voucher = await prisma.voucher.create({
      data: {
        code: dto.code,
        discount_type: dto.discount_type,
        discount_value: dto.discount_value,
        max_discount_amount: dto.max_discount_amount,
        min_order_amount: dto.min_order_amount,
        expiry_date: new Date(dto.expiry_date),
        max_usage: dto.max_usage,
        is_active: dto.is_active,
      },
    })

    return this.toVoucherResult(voucher)
  }

  async createPromo(dto: CreatePromoDto): Promise<PromoResult> {
    const existing = await prisma.promo.findUnique({ where: { code: dto.code } })
    if (existing) {
      throw new ConflictError('Kode promo sudah digunakan')
    }
    const voucherExisting = await prisma.voucher.findUnique({ where: { code: dto.code } })
    if (voucherExisting) {
      throw new ConflictError('Kode sudah digunakan oleh voucher lain')
    }

    const promo = await prisma.promo.create({
      data: {
        code: dto.code,
        name: sanitizeText(dto.name),
        description: dto.description ? sanitizeText(dto.description) : undefined,
        discount_type: dto.discount_type,
        discount_value: dto.discount_value,
        max_discount_amount: dto.max_discount_amount,
        min_order_amount: dto.min_order_amount,
        expiry_date: new Date(dto.expiry_date),
        is_active: dto.is_active,
      },
    })

    return this.toPromoResult(promo)
  }

  async getVouchers(query: GetDiscountsQueryDto): Promise<{ data: VoucherResult[]; meta: PaginationMeta }> {
    const { page, limit, is_active } = query

    const where: Prisma.VoucherWhereInput = {
      ...(is_active !== undefined ? { is_active } : {}),
    }

    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.voucher.count({ where }),
    ])

    return {
      data: vouchers.map((v) => this.toVoucherResult(v)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getVoucherById(id: string): Promise<VoucherResult> {
    const voucher = await prisma.voucher.findUnique({ where: { id } })
    if (!voucher) {
      throw new NotFoundError('Voucher tidak ditemukan')
    }
    return this.toVoucherResult(voucher)
  }

  async getPromos(query: GetDiscountsQueryDto): Promise<{ data: PromoResult[]; meta: PaginationMeta }> {
    const { page, limit, is_active } = query

    const where: Prisma.PromoWhereInput = {
      ...(is_active !== undefined ? { is_active } : {}),
    }

    const [promos, total] = await Promise.all([
      prisma.promo.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.promo.count({ where }),
    ])

    return {
      data: promos.map((p) => this.toPromoResult(p)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getPromoById(id: string): Promise<PromoResult> {
    const promo = await prisma.promo.findUnique({ where: { id } })
    if (!promo) {
      throw new NotFoundError('Promo tidak ditemukan')
    }
    return this.toPromoResult(promo)
  }

  async validateDiscountCode(code: string, subtotal: number): Promise<ValidateDiscountResult> {
    const discount = await this.validateCode(prisma, code, subtotal)
    const discountAmount = this.calculateDiscount(discount, subtotal)

    const record =
      discount.type === 'VOUCHER'
        ? await prisma.voucher.findUnique({ where: { id: discount.id } })
        : await prisma.promo.findUnique({ where: { id: discount.id } })
    if (!record) {
      throw new NotFoundError('Kode diskon tidak ditemukan')
    }

    return {
      ...discount,
      is_valid: true,
      discount_amount: discountAmount,
      min_order_amount: record.min_order_amount !== null ? Number(record.min_order_amount) : null,
      expiry_date: record.expiry_date,
    }
  }

  async validateCode(db: DiscountDb, code: string, subtotal: number): Promise<DiscountCodeResult> {
    const voucher = await db.voucher.findUnique({ where: { code } })
    if (voucher) {
      return this.validateVoucher(voucher, subtotal)
    }

    const promo = await db.promo.findUnique({ where: { code } })
    if (promo) {
      return this.validatePromo(promo, subtotal)
    }

    throw new BadRequestError('Kode diskon tidak valid')
  }

  calculateDiscount(discount: DiscountCodeResult, subtotal: number): number {
    return applyDiscount(
      discount.discount_type,
      discount.discount_value,
      subtotal,
      discount.max_discount_amount ?? undefined
    )
  }

  async incrementVoucherUsage(db: DiscountDb, voucherId: string): Promise<void> {
    await db.voucher.update({
      where: { id: voucherId },
      data: { current_usage: { increment: 1 } },
    })
  }

  private validateVoucher(
    voucher: {
      id: string
      code: string
      discount_type: string
      discount_value: Prisma.Decimal
      max_discount_amount: Prisma.Decimal | null
      min_order_amount: Prisma.Decimal | null
      expiry_date: Date
      max_usage: number
      current_usage: number
      is_active: boolean
    },
    subtotal: number
  ): DiscountCodeResult {
    if (!voucher.is_active) {
      throw new BadRequestError('Voucher tidak aktif')
    }
    if (voucher.expiry_date < new Date()) {
      throw new BadRequestError('Voucher sudah kadaluarsa')
    }
    if (voucher.current_usage >= voucher.max_usage) {
      throw new BadRequestError('Batas penggunaan voucher sudah tercapai')
    }
    if (voucher.min_order_amount !== null && subtotal < Number(voucher.min_order_amount)) {
      throw new BadRequestError(
        `Minimal belanja untuk voucher ini adalah Rp ${Number(voucher.min_order_amount).toLocaleString('id-ID')}`
      )
    }

    return {
      type: 'VOUCHER',
      id: voucher.id,
      code: voucher.code,
      discount_type: voucher.discount_type as 'PERCENTAGE' | 'FIXED_AMOUNT',
      discount_value: Number(voucher.discount_value),
      max_discount_amount: voucher.max_discount_amount !== null ? Number(voucher.max_discount_amount) : null,
    }
  }

  private validatePromo(
    promo: {
      id: string
      code: string
      discount_type: string
      discount_value: Prisma.Decimal
      max_discount_amount: Prisma.Decimal | null
      min_order_amount: Prisma.Decimal | null
      expiry_date: Date
      is_active: boolean
    },
    subtotal: number
  ): DiscountCodeResult {
    if (!promo.is_active) {
      throw new BadRequestError('Promo tidak aktif')
    }
    if (promo.expiry_date < new Date()) {
      throw new BadRequestError('Promo sudah kadaluarsa')
    }
    if (promo.min_order_amount !== null && subtotal < Number(promo.min_order_amount)) {
      throw new BadRequestError(
        `Minimal belanja untuk promo ini adalah Rp ${Number(promo.min_order_amount).toLocaleString('id-ID')}`
      )
    }

    return {
      type: 'PROMO',
      id: promo.id,
      code: promo.code,
      discount_type: promo.discount_type as 'PERCENTAGE' | 'FIXED_AMOUNT',
      discount_value: Number(promo.discount_value),
      max_discount_amount: promo.max_discount_amount !== null ? Number(promo.max_discount_amount) : null,
    }
  }

  private toVoucherResult(voucher: VoucherRow): VoucherResult {
    return {
      id: voucher.id,
      code: voucher.code,
      discount_type: voucher.discount_type as 'PERCENTAGE' | 'FIXED_AMOUNT',
      discount_value: Number(voucher.discount_value),
      max_discount_amount: voucher.max_discount_amount !== null ? Number(voucher.max_discount_amount) : null,
      min_order_amount: voucher.min_order_amount !== null ? Number(voucher.min_order_amount) : null,
      expiry_date: voucher.expiry_date,
      max_usage: voucher.max_usage,
      current_usage: voucher.current_usage,
      is_active: voucher.is_active,
      created_at: voucher.created_at,
      updated_at: voucher.updated_at,
    }
  }

  private toPromoResult(promo: PromoRow): PromoResult {
    return {
      id: promo.id,
      code: promo.code,
      name: promo.name,
      description: promo.description,
      discount_type: promo.discount_type as 'PERCENTAGE' | 'FIXED_AMOUNT',
      discount_value: Number(promo.discount_value),
      max_discount_amount: promo.max_discount_amount !== null ? Number(promo.max_discount_amount) : null,
      min_order_amount: promo.min_order_amount !== null ? Number(promo.min_order_amount) : null,
      expiry_date: promo.expiry_date,
      is_active: promo.is_active,
      created_at: promo.created_at,
      updated_at: promo.updated_at,
    }
  }
}

export const discountService = new DiscountService()
