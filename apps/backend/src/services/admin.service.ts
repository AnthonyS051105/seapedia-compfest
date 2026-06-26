import { Prisma } from '@prisma/client'
import { prisma } from '../prisma/client'
import { overdueService } from './overdue.service'
import { PaginationMeta } from '../utils/response'
import {
  GetUsersQueryDto,
  GetStoresQueryDto,
  GetAdminOrdersQueryDto,
  GetDeliveryJobsQueryDto,
  GetOverdueOrdersQueryDto,
} from '../schemas/admin.schema'

const ROLES = ['ADMIN', 'SELLER', 'BUYER', 'DRIVER'] as const
const ORDER_STATUSES = [
  'SEDANG_DIKEMAS',
  'MENUNGGU_PENGIRIM',
  'SEDANG_DIKIRIM',
  'PESANAN_SELESAI',
  'DIKEMBALIKAN',
] as const

export interface DashboardStatsResult {
  users: {
    total: number
    by_role: Record<string, number>
  }
  stores: {
    total: number
    active: number
  }
  products: {
    total: number
    active: number
    out_of_stock: number
  }
  orders: {
    total: number
    by_status: Record<string, number>
  }
  vouchers: {
    total: number
    active: number
    expired: number
  }
  promos: {
    total: number
    active: number
  }
  delivery_jobs: {
    total: number
    available: number
    in_progress: number
    completed: number
  }
  overdue_orders: number
  system_date_offset: number
}

export interface AdminUserListItem {
  id: string
  username: string
  email: string
  full_name: string | null
  phone: string | null
  roles: string[]
  created_at: Date
}

export interface AdminStoreListItem {
  id: string
  name: string
  description: string | null
  is_active: boolean
  seller: {
    id: string
    username: string
    email: string
  }
  created_at: Date
}

export interface AdminOrderListItem {
  id: string
  buyer_id: string
  store_id: string
  status: string
  delivery_method: string
  final_total: number
  is_overdue_processed: boolean
  created_at: Date
}

export interface AdminDeliveryJobListItem {
  id: string
  order_id: string
  driver_id: string | null
  status: string
  delivery_method: string
  earning: number | null
  taken_at: Date | null
  completed_at: Date | null
  created_at: Date
}

class AdminService {
  async getDashboardStats(): Promise<DashboardStatsResult> {
    const [
      totalUsers,
      usersByRoleRaw,
      totalStores,
      activeStores,
      totalProducts,
      activeProducts,
      outOfStockProducts,
      totalOrders,
      ordersByStatusRaw,
      totalVouchers,
      activeVouchersCount,
      promosTotal,
      activePromosCount,
      totalJobs,
      availableJobs,
      inProgressJobs,
      completedJobs,
      overdueOrdersCount,
      systemDateOffset,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.userRole.groupBy({ by: ['role'], _count: { role: true } }),
      prisma.store.count(),
      prisma.store.count({ where: { is_active: true } }),
      prisma.product.count({ where: { deleted_at: null } }),
      prisma.product.count({ where: { deleted_at: null, is_active: true } }),
      prisma.product.count({ where: { deleted_at: null, stock: 0 } }),
      prisma.order.count(),
      prisma.order.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.voucher.count(),
      prisma.voucher.count({ where: { is_active: true, expiry_date: { gt: new Date() } } }),
      prisma.promo.count(),
      prisma.promo.count({ where: { is_active: true, expiry_date: { gt: new Date() } } }),
      prisma.deliveryJob.count(),
      prisma.deliveryJob.count({ where: { driver_id: null, order: { status: 'MENUNGGU_PENGIRIM' } } }),
      prisma.deliveryJob.count({ where: { order: { status: 'SEDANG_DIKIRIM' } } }),
      prisma.deliveryJob.count({ where: { order: { status: 'PESANAN_SELESAI' } } }),
      prisma.order.count({ where: { status: 'DIKEMBALIKAN' } }),
      overdueService.getSystemDateOffset(),
    ])

    const usersByRole: Record<string, number> = {}
    for (const role of ROLES) {
      usersByRole[role] = 0
    }
    for (const row of usersByRoleRaw) {
      usersByRole[row.role] = row._count.role
    }

    const ordersByStatus: Record<string, number> = {}
    for (const status of ORDER_STATUSES) {
      ordersByStatus[status] = 0
    }
    for (const row of ordersByStatusRaw) {
      ordersByStatus[row.status] = row._count.status
    }

    const expiredVouchers = totalVouchers - activeVouchersCount

    return {
      users: { total: totalUsers, by_role: usersByRole },
      stores: { total: totalStores, active: activeStores },
      products: { total: totalProducts, active: activeProducts, out_of_stock: outOfStockProducts },
      orders: { total: totalOrders, by_status: ordersByStatus },
      vouchers: { total: totalVouchers, active: activeVouchersCount, expired: expiredVouchers },
      promos: { total: promosTotal, active: activePromosCount },
      delivery_jobs: {
        total: totalJobs,
        available: availableJobs,
        in_progress: inProgressJobs,
        completed: completedJobs,
      },
      overdue_orders: overdueOrdersCount,
      system_date_offset: systemDateOffset,
    }
  }

  async getUsers(query: GetUsersQueryDto): Promise<{ data: AdminUserListItem[]; meta: PaginationMeta }> {
    const { page, limit } = query

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user_roles: { select: { role: true } } },
      }),
      prisma.user.count(),
    ])

    return {
      data: users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        roles: user.user_roles.map((r) => r.role),
        created_at: user.created_at,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getStores(query: GetStoresQueryDto): Promise<{ data: AdminStoreListItem[]; meta: PaginationMeta }> {
    const { page, limit } = query

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { seller_profile: { include: { user: true } } },
      }),
      prisma.store.count(),
    ])

    return {
      data: stores.map((store) => ({
        id: store.id,
        name: store.name,
        description: store.description,
        is_active: store.is_active,
        seller: {
          id: store.seller_profile.user.id,
          username: store.seller_profile.user.username,
          email: store.seller_profile.user.email,
        },
        created_at: store.created_at,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getOrders(query: GetAdminOrdersQueryDto): Promise<{ data: AdminOrderListItem[]; meta: PaginationMeta }> {
    const { page, limit, status } = query

    const where: Prisma.OrderWhereInput = status ? { status } : {}

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
      data: orders.map((order) => ({
        id: order.id,
        buyer_id: order.buyer_id,
        store_id: order.store_id,
        status: order.status,
        delivery_method: order.delivery_method,
        final_total: Number(order.final_total),
        is_overdue_processed: order.is_overdue_processed,
        created_at: order.created_at,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getDeliveryJobs(
    query: GetDeliveryJobsQueryDto
  ): Promise<{ data: AdminDeliveryJobListItem[]; meta: PaginationMeta }> {
    const { page, limit } = query

    const [jobs, total] = await Promise.all([
      prisma.deliveryJob.findMany({
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { order: { select: { status: true, delivery_method: true } } },
      }),
      prisma.deliveryJob.count(),
    ])

    return {
      data: jobs.map((job) => ({
        id: job.id,
        order_id: job.order_id,
        driver_id: job.driver_id,
        status: job.order.status,
        delivery_method: job.order.delivery_method,
        earning: job.earning !== null ? Number(job.earning) : null,
        taken_at: job.taken_at,
        completed_at: job.completed_at,
        created_at: job.created_at,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getOverdueOrders(
    query: GetOverdueOrdersQueryDto
  ): Promise<{ data: AdminOrderListItem[]; meta: PaginationMeta }> {
    const { page, limit } = query

    const where: Prisma.OrderWhereInput = { status: 'DIKEMBALIKAN' }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { updated_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return {
      data: orders.map((order) => ({
        id: order.id,
        buyer_id: order.buyer_id,
        store_id: order.store_id,
        status: order.status,
        delivery_method: order.delivery_method,
        final_total: Number(order.final_total),
        is_overdue_processed: order.is_overdue_processed,
        created_at: order.created_at,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }
}

export const adminService = new AdminService()
