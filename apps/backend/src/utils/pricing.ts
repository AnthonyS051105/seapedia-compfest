export type DeliveryMethod = 'INSTANT' | 'NEXT_DAY' | 'REGULAR'
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT'

export const DELIVERY_FEES: Record<DeliveryMethod, number> = {
  INSTANT: 15000,
  NEXT_DAY: 10000,
  REGULAR: 6000,
}

export const PPN_RATE = 0.12
export const DRIVER_EARNING_RATE = 0.8

export interface PricingItem {
  price: number
  quantity: number
}

export interface PricingBreakdown {
  subtotal: number
  discount_amount: number
  discounted_subtotal: number
  delivery_fee: number
  ppn_amount: number
  final_total: number
}

export function calculatePricing(
  items: PricingItem[],
  deliveryMethod: DeliveryMethod,
  discountAmount: number = 0
): PricingBreakdown {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountedSubtotal = Math.max(0, subtotal - discountAmount)
  const deliveryFee = DELIVERY_FEES[deliveryMethod]
  const taxBase = discountedSubtotal + deliveryFee
  const ppnAmount = Math.round(taxBase * PPN_RATE)
  const finalTotal = taxBase + ppnAmount

  return {
    subtotal,
    discount_amount: discountAmount,
    discounted_subtotal: discountedSubtotal,
    delivery_fee: deliveryFee,
    ppn_amount: ppnAmount,
    final_total: finalTotal,
  }
}

export function calculateDriverEarning(deliveryMethod: DeliveryMethod): number {
  return DELIVERY_FEES[deliveryMethod] * DRIVER_EARNING_RATE
}

export function applyDiscount(
  discountType: DiscountType,
  discountValue: number,
  subtotal: number,
  maxDiscountAmount?: number
): number {
  let amount: number
  if (discountType === 'PERCENTAGE') {
    amount = subtotal * (discountValue / 100)
    if (maxDiscountAmount !== undefined) {
      amount = Math.min(amount, maxDiscountAmount)
    }
  } else {
    amount = discountValue
  }
  return Math.min(amount, subtotal)
}
