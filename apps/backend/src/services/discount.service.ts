import { Prisma, PrismaClient } from '@prisma/client'
import { applyDiscount } from '../utils/pricing'
import { BadRequestError } from '../utils/errors'

export type DiscountDb = PrismaClient | Prisma.TransactionClient

export interface DiscountCodeResult {
  type: 'VOUCHER' | 'PROMO'
  id: string
  code: string
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discount_value: number
  max_discount_amount: number | null
}

class DiscountService {
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
}

export const discountService = new DiscountService()
