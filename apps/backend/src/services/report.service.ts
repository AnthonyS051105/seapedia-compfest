import { Prisma } from '@prisma/client'
import { prisma } from '../prisma/client'
import { BadRequestError } from '../utils/errors'
import { GetSpendingReportQueryDto } from '../schemas/order.schema'

export interface SpendingReportOrderResult {
  id: string
  store_id: string
  store_name: string
  status: string
  final_total: number
  created_at: Date
}

export interface SpendingReportMonthlyBreakdown {
  month: string
  total_spent: number
  order_count: number
}

export interface SpendingReportOrdersByStatus {
  SEDANG_DIKEMAS: number
  MENUNGGU_PENGIRIM: number
  SEDANG_DIKIRIM: number
  PESANAN_SELESAI: number
  DIKEMBALIKAN: number
}

export interface SpendingReportResult {
  total_spent: number
  order_count: number
  orders_by_status: SpendingReportOrdersByStatus
  monthly_breakdown: SpendingReportMonthlyBreakdown[]
  from_date: string | null
  to_date: string | null
  orders: SpendingReportOrderResult[]
}

class ReportService {
  async getSpendingReport(userId: string, query: GetSpendingReportQueryDto): Promise<SpendingReportResult> {
    const buyerProfile = await this.getBuyerProfileOrThrow(userId)
    const { from_date, to_date } = query

    const dateFilter =
      from_date || to_date
        ? {
            created_at: {
              ...(from_date ? { gte: new Date(from_date) } : {}),
              ...(to_date ? { lte: new Date(to_date) } : {}),
            },
          }
        : {}

    const orderWhere: Prisma.OrderWhereInput = {
      buyer_id: buyerProfile.id,
      ...dateFilter,
    }

    const walletWhere: Prisma.WalletTransactionWhereInput = {
      buyer_id: buyerProfile.id,
      type: 'PAYMENT',
      ...dateFilter,
    }

    const [orders, paymentTransactions] = await Promise.all([
      prisma.order.findMany({
        where: orderWhere,
        select: {
          id: true,
          store_id: true,
          status: true,
          final_total: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.walletTransaction.findMany({
        where: walletWhere,
        select: { amount: true },
      }),
    ])

    const storeIds = Array.from(new Set(orders.map((order) => order.store_id)))
    const stores = await prisma.store.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, name: true },
    })
    const storeNameById = new Map(stores.map((store) => [store.id, store.name]))

    const totalSpent = paymentTransactions.reduce((sum, t) => sum + Number(t.amount), 0)

    const ordersByStatus: SpendingReportOrdersByStatus = {
      SEDANG_DIKEMAS: 0,
      MENUNGGU_PENGIRIM: 0,
      SEDANG_DIKIRIM: 0,
      PESANAN_SELESAI: 0,
      DIKEMBALIKAN: 0,
    }
    for (const order of orders) {
      ordersByStatus[order.status] += 1
    }

    const monthlyMap = new Map<string, { total_spent: number; order_count: number }>()
    for (const order of orders) {
      const month = order.created_at.toISOString().slice(0, 7)
      const entry = monthlyMap.get(month) ?? { total_spent: 0, order_count: 0 }
      entry.total_spent += Number(order.final_total)
      entry.order_count += 1
      monthlyMap.set(month, entry)
    }
    const monthlyBreakdown: SpendingReportMonthlyBreakdown[] = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({ month, total_spent: value.total_spent, order_count: value.order_count }))

    return {
      total_spent: totalSpent,
      order_count: orders.length,
      orders_by_status: ordersByStatus,
      monthly_breakdown: monthlyBreakdown,
      from_date: from_date ?? null,
      to_date: to_date ?? null,
      orders: orders.map((order) => ({
        id: order.id,
        store_id: order.store_id,
        store_name: storeNameById.get(order.store_id) ?? 'Toko tidak ditemukan',
        status: order.status,
        final_total: Number(order.final_total),
        created_at: order.created_at,
      })),
    }
  }

  private async getBuyerProfileOrThrow(userId: string): Promise<{ id: string }> {
    const buyerProfile = await prisma.buyerProfile.findUnique({ where: { user_id: userId } })
    if (!buyerProfile) {
      throw new BadRequestError('Akun ini tidak memiliki profil pembeli')
    }
    return buyerProfile
  }
}

export const reportService = new ReportService()
