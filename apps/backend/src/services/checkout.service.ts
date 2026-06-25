import { Prisma } from '@prisma/client'
import { prisma } from '../prisma/client'
import { CheckoutDto } from '../schemas/checkout.schema'
import { calculatePricing, DeliveryMethod } from '../utils/pricing'
import { discountService, DiscountCodeResult } from './discount.service'
import { BadRequestError, NotFoundError } from '../utils/errors'
import { PaginationMeta } from '../utils/response'

export interface PricingBreakdownResult {
  subtotal: number
  discount_amount: number
  discount_code: string | null
  discount_type: 'VOUCHER' | 'PROMO' | null
  delivery_fee: number
  ppn_amount: number
  final_total: number
}

export interface CheckoutPreviewResult extends PricingBreakdownResult {
  wallet_balance: number
  is_balance_enough: boolean
}

export interface OrderItemResult {
  id: string
  product_id: string
  product_name: string
  product_price: number
  quantity: number
  subtotal: number
}

export interface OrderStatusHistoryResult {
  id: string
  status: string
  note: string | null
  created_at: Date
}

export interface OrderResult extends PricingBreakdownResult {
  id: string
  buyer_id: string
  store_id: string
  address_id: string
  delivery_method: string
  status: string
  created_at: Date
}

export interface OrderDetailResult extends OrderResult {
  order_items: OrderItemResult[]
  status_history: OrderStatusHistoryResult[]
}

interface CartItemWithProduct {
  product_id: string
  quantity: number
  product: {
    name: string
    price: Prisma.Decimal
    stock: number
    store_id: string
  }
}

class CheckoutService {
  async previewCheckout(userId: string, dto: CheckoutDto): Promise<CheckoutPreviewResult> {
    const buyerProfile = await this.getBuyerProfileOrThrow(userId)
    const cartItems = await this.getCartItemsOrThrow(buyerProfile.id)

    await this.assertAddressOwnership(buyerProfile.id, dto.address_id)

    const subtotal = this.calculateSubtotal(cartItems)

    let discount: DiscountCodeResult | null = null
    let discountAmount = 0
    if (dto.discount_code) {
      discount = await discountService.validateCode(prisma, dto.discount_code, subtotal)
      discountAmount = discountService.calculateDiscount(discount, subtotal)
    }

    const pricing = calculatePricing(
      cartItems.map((item) => ({ price: Number(item.product.price), quantity: item.quantity })),
      dto.delivery_method as DeliveryMethod,
      discountAmount
    )

    return {
      subtotal: pricing.subtotal,
      discount_amount: pricing.discount_amount,
      discount_code: discount?.code ?? null,
      discount_type: discount?.type ?? null,
      delivery_fee: pricing.delivery_fee,
      ppn_amount: pricing.ppn_amount,
      final_total: pricing.final_total,
      wallet_balance: Number(buyerProfile.balance),
      is_balance_enough: Number(buyerProfile.balance) >= pricing.final_total,
    }
  }

  async checkout(userId: string, dto: CheckoutDto): Promise<OrderDetailResult> {
    const buyerProfile = await this.getBuyerProfileOrThrow(userId)

    const orderId = await prisma.$transaction(async (tx) => {
      // Step 1: cart must not be empty
      const cartItems = await tx.cartItem.findMany({
        where: { buyer_id: buyerProfile.id },
        include: {
          product: { select: { name: true, price: true, stock: true, store_id: true } },
        },
      })
      if (cartItems.length === 0) {
        throw new BadRequestError('Keranjang kosong')
      }

      // Step 2: stock check
      for (const item of cartItems) {
        if (item.quantity > item.product.stock) {
          throw new BadRequestError(`Stok produk '${item.product.name}' tidak mencukupi`)
        }
      }

      // Step 3: address ownership
      const address = await tx.deliveryAddress.findFirst({
        where: { id: dto.address_id, buyer_id: buyerProfile.id },
      })
      if (!address) {
        throw new NotFoundError('Alamat pengiriman tidak ditemukan')
      }

      const subtotal = this.calculateSubtotal(cartItems)

      // Step 4: discount validation
      let discount: DiscountCodeResult | null = null
      let discountAmount = 0
      if (dto.discount_code) {
        discount = await discountService.validateCode(tx, dto.discount_code, subtotal)
        discountAmount = discountService.calculateDiscount(discount, subtotal)
      }

      // Step 5: pricing
      const pricing = calculatePricing(
        cartItems.map((item) => ({ price: Number(item.product.price), quantity: item.quantity })),
        dto.delivery_method as DeliveryMethod,
        discountAmount
      )

      // Step 6: wallet balance check
      const buyer = await tx.buyerProfile.findUnique({ where: { id: buyerProfile.id } })
      if (!buyer || Number(buyer.balance) < pricing.final_total) {
        throw new BadRequestError('Saldo dompet tidak mencukupi')
      }

      // Step 7: deduct wallet
      await tx.buyerProfile.update({
        where: { id: buyerProfile.id },
        data: { balance: { decrement: pricing.final_total } },
      })

      // Step 8: PAYMENT wallet transaction
      await tx.walletTransaction.create({
        data: {
          buyer_id: buyerProfile.id,
          type: 'PAYMENT',
          amount: pricing.final_total,
          description: 'Pembayaran pesanan',
        },
      })

      // Step 9: reduce stock (conditional, no negative stock)
      for (const item of cartItems) {
        const updated = await tx.product.updateMany({
          where: { id: item.product_id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        })
        if (updated.count === 0) {
          throw new BadRequestError(`Stok produk '${item.product.name}' tidak mencukupi`)
        }
      }

      // Step 10: create order
      const storeId = cartItems[0].product.store_id
      const order = await tx.order.create({
        data: {
          buyer_id: buyerProfile.id,
          store_id: storeId,
          address_id: dto.address_id,
          delivery_method: dto.delivery_method,
          status: 'SEDANG_DIKEMAS',
          subtotal: pricing.subtotal,
          discount_amount: pricing.discount_amount,
          delivery_fee: pricing.delivery_fee,
          ppn_amount: pricing.ppn_amount,
          final_total: pricing.final_total,
          discount_code: discount?.code ?? null,
          discount_type: discount?.type ?? null,
          voucher_id: discount?.type === 'VOUCHER' ? discount.id : null,
          promo_id: discount?.type === 'PROMO' ? discount.id : null,
        },
      })

      // Step 11: order items (price snapshot)
      await tx.orderItem.createMany({
        data: cartItems.map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product.name,
          product_price: item.product.price,
          quantity: item.quantity,
          subtotal: Number(item.product.price) * item.quantity,
        })),
      })

      // Step 12: status history
      await tx.orderStatusHistory.create({
        data: { order_id: order.id, status: 'SEDANG_DIKEMAS' },
      })

      // Step 13: increment voucher usage
      if (discount?.type === 'VOUCHER') {
        await discountService.incrementVoucherUsage(tx, discount.id)
      }

      // Step 14: clear cart
      await tx.cartItem.deleteMany({ where: { buyer_id: buyerProfile.id } })

      return order.id
    })

    return this.getOrderDetail(userId, orderId)
  }

  async getOrders(
    userId: string,
    query: { page: number; limit: number; status?: string }
  ): Promise<{ data: OrderResult[]; meta: PaginationMeta }> {
    const buyerProfile = await this.getBuyerProfileOrThrow(userId)
    const { page, limit, status } = query

    const where: Prisma.OrderWhereInput = {
      buyer_id: buyerProfile.id,
      ...(status ? { status: status as Prisma.OrderWhereInput['status'] } : {}),
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return {
      data: orders.map((o) => this.toOrderResult(o)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getOrderDetail(userId: string, orderId: string): Promise<OrderDetailResult> {
    const buyerProfile = await this.getBuyerProfileOrThrow(userId)

    const order = await prisma.order.findFirst({
      where: { id: orderId, buyer_id: buyerProfile.id },
      include: {
        order_items: true,
        status_history: { orderBy: { created_at: 'asc' } },
      },
    })
    if (!order) {
      throw new NotFoundError('Pesanan tidak ditemukan')
    }

    return {
      ...this.toOrderResult(order),
      order_items: order.order_items.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_price: Number(item.product_price),
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
      })),
      status_history: order.status_history.map((h) => ({
        id: h.id,
        status: h.status,
        note: h.note,
        created_at: h.created_at,
      })),
    }
  }

  private calculateSubtotal(items: CartItemWithProduct[]): number {
    return items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0)
  }

  private async getCartItemsOrThrow(buyerId: string): Promise<CartItemWithProduct[]> {
    const cartItems = await prisma.cartItem.findMany({
      where: { buyer_id: buyerId },
      include: {
        product: { select: { name: true, price: true, stock: true, store_id: true } },
      },
    })
    if (cartItems.length === 0) {
      throw new BadRequestError('Keranjang kosong')
    }
    return cartItems
  }

  private async assertAddressOwnership(buyerId: string, addressId: string): Promise<void> {
    const address = await prisma.deliveryAddress.findFirst({ where: { id: addressId, buyer_id: buyerId } })
    if (!address) {
      throw new NotFoundError('Alamat pengiriman tidak ditemukan')
    }
  }

  private async getBuyerProfileOrThrow(userId: string): Promise<{ id: string; balance: Prisma.Decimal }> {
    const buyerProfile = await prisma.buyerProfile.findUnique({ where: { user_id: userId } })
    if (!buyerProfile) {
      throw new BadRequestError('Akun ini tidak memiliki profil pembeli')
    }
    return buyerProfile
  }

  private toOrderResult(order: {
    id: string
    buyer_id: string
    store_id: string
    address_id: string
    delivery_method: string
    status: string
    subtotal: Prisma.Decimal
    discount_amount: Prisma.Decimal
    discount_code: string | null
    discount_type: string | null
    delivery_fee: Prisma.Decimal
    ppn_amount: Prisma.Decimal
    final_total: Prisma.Decimal
    created_at: Date
  }): OrderResult {
    return {
      id: order.id,
      buyer_id: order.buyer_id,
      store_id: order.store_id,
      address_id: order.address_id,
      delivery_method: order.delivery_method,
      status: order.status,
      subtotal: Number(order.subtotal),
      discount_amount: Number(order.discount_amount),
      discount_code: order.discount_code,
      discount_type: order.discount_type as 'VOUCHER' | 'PROMO' | null,
      delivery_fee: Number(order.delivery_fee),
      ppn_amount: Number(order.ppn_amount),
      final_total: Number(order.final_total),
      created_at: order.created_at,
    }
  }
}

export const checkoutService = new CheckoutService()
