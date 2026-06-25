import { prisma } from '../prisma/client'
import { DeliveryMethod } from '../utils/pricing'

const SYSTEM_DATE_OFFSET_KEY = 'system_date_offset'

const SLA_DAYS: Record<DeliveryMethod, number> = {
  INSTANT: 1,
  NEXT_DAY: 2,
  REGULAR: 3,
}

const OVERDUE_ELIGIBLE_STATUSES = ['SEDANG_DIKEMAS', 'MENUNGGU_PENGIRIM', 'SEDANG_DIKIRIM'] as const

export interface SimulateNextDayResult {
  new_offset: number
  processed_count: number
}

interface OverdueOrderRow {
  id: string
  buyer_id: string
  delivery_method: string
  final_total: import('@prisma/client').Prisma.Decimal
  created_at: Date
  order_items: {
    product_id: string
    quantity: number
  }[]
}

class OverdueService {
  async getSystemDate(): Promise<Date> {
    const config = await prisma.systemConfig.findUnique({
      where: { key: SYSTEM_DATE_OFFSET_KEY },
    })
    const offset = parseInt(config?.value ?? '0', 10)
    const now = new Date()
    now.setDate(now.getDate() + offset)
    return now
  }

  async simulateNextDay(): Promise<SimulateNextDayResult> {
    const existing = await prisma.systemConfig.findUnique({
      where: { key: SYSTEM_DATE_OFFSET_KEY },
    })
    const newOffset = existing ? parseInt(existing.value, 10) + 1 : 1

    await prisma.systemConfig.upsert({
      where: { key: SYSTEM_DATE_OFFSET_KEY },
      update: { value: String(newOffset) },
      create: { key: SYSTEM_DATE_OFFSET_KEY, value: String(newOffset) },
    })

    const processedCount = await this.processOverdueOrders()

    return { new_offset: newOffset, processed_count: processedCount }
  }

  async processOverdueOrders(): Promise<number> {
    const systemDate = await this.getSystemDate()

    const candidates = await prisma.order.findMany({
      where: {
        is_overdue_processed: false,
        status: { in: [...OVERDUE_ELIGIBLE_STATUSES] },
      },
      include: {
        order_items: { select: { product_id: true, quantity: true } },
      },
    })

    let processedCount = 0

    for (const order of candidates as OverdueOrderRow[]) {
      const slaDays = SLA_DAYS[order.delivery_method as DeliveryMethod]
      const deadline = new Date(order.created_at)
      deadline.setDate(deadline.getDate() + slaDays)

      if (systemDate > deadline) {
        await this.refundOrder(order)
        processedCount += 1
      }
    }

    return processedCount
  }

  async refundOrder(order: OverdueOrderRow): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id: order.id },
        select: { is_overdue_processed: true },
      })
      if (!current || current.is_overdue_processed) {
        return
      }

      await tx.order.update({
        where: { id: order.id },
        data: { is_overdue_processed: true, status: 'DIKEMBALIKAN' },
      })

      await tx.orderStatusHistory.create({
        data: {
          order_id: order.id,
          status: 'DIKEMBALIKAN',
          note: 'Auto-returned: SLA exceeded',
        },
      })

      await tx.buyerProfile.update({
        where: { id: order.buyer_id },
        data: { balance: { increment: order.final_total } },
      })

      await tx.walletTransaction.create({
        data: {
          buyer_id: order.buyer_id,
          type: 'REFUND',
          amount: order.final_total,
          description: `Refund for overdue order ${order.id}`,
          order_id: order.id,
        },
      })

      for (const item of order.order_items) {
        await tx.product.update({
          where: { id: item.product_id },
          data: { stock: { increment: item.quantity } },
        })
      }
    })
  }
}

export const overdueService = new OverdueService()
