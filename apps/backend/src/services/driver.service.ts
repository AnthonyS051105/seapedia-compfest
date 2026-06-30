import { Prisma } from '@prisma/client'
import { prisma } from '../prisma/client'
import { GetDriverJobsQueryDto, GetDriverEarningsQueryDto } from '../schemas/driver.schema'
import { calculateDriverEarning, DeliveryMethod } from '../utils/pricing'
import { ConflictError, NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors'
import { PaginationMeta } from '../utils/response'

const JOB_AVAILABLE_STATUS = 'MENUNGGU_PENGIRIM' as const
const JOB_ACTIVE_STATUS = 'SEDANG_DIKIRIM' as const
const JOB_COMPLETED_STATUS = 'PESANAN_SELESAI' as const

export interface AvailableJobItem {
  id: string
  order_id: string
  delivery_method: string
  estimated_earning: number
  destination_city: string
  delivery_fee: number
  created_at: Date
}

export interface AddressSummary {
  label: string
  recipient_name: string
  phone: string
  street: string
  city: string
  province: string
  postal_code: string
}

export interface OrderItemSummary {
  id: string
  product_id: string
  product_name: string
  product_price: number
  quantity: number
  subtotal: number
}

export interface OrderStatusHistoryItem {
  id: string
  status: string
  note: string | null
  created_at: Date
}

export interface JobDetailResult {
  id: string
  order_id: string
  driver_id: string | null
  status: string
  delivery_method: string
  delivery_fee: number
  estimated_earning: number
  earning: number | null
  taken_at: Date | null
  completed_at: Date | null
  address: AddressSummary
  order_items: OrderItemSummary[]
  status_history: OrderStatusHistoryItem[]
  created_at: Date
}

export interface DriverEarningsJobItem {
  job_id: string
  order_id: string
  delivery_method: string
  earning: number
  completed_at: Date | null
}

export interface DriverEarningsResult {
  total_earnings: number
  completed_jobs_count: number
  from_date: string | null
  to_date: string | null
  jobs: DriverEarningsJobItem[]
}

interface DeliveryJobRow {
  id: string
  order_id: string
  driver_id: string | null
}

class DriverService {
  async getAvailableJobs(
    _driverId: string,
    query: GetDriverJobsQueryDto
  ): Promise<{ data: AvailableJobItem[]; meta: PaginationMeta }> {
    const { page, limit } = query

    const where: Prisma.DeliveryJobWhereInput = {
      driver_id: null,
      order: { status: JOB_AVAILABLE_STATUS },
    }

    const [jobs, total] = await Promise.all([
      prisma.deliveryJob.findMany({
        where,
        orderBy: { created_at: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          order: { include: { delivery_address: { select: { city: true } } } },
        },
      }),
      prisma.deliveryJob.count({ where }),
    ])

    return {
      data: jobs.map((job) => ({
        id: job.id,
        order_id: job.order_id,
        delivery_method: job.order.delivery_method,
        estimated_earning: calculateDriverEarning(job.order.delivery_method as DeliveryMethod),
        destination_city: job.order.delivery_address.city,
        delivery_fee: Number(job.order.delivery_fee),
        created_at: job.created_at,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getActiveJob(driverId: string): Promise<JobDetailResult | null> {
    const driverProfile = await this.getDriverProfileOrThrow(driverId)

    const job = await prisma.deliveryJob.findFirst({
      where: { driver_id: driverProfile.id, order: { status: JOB_ACTIVE_STATUS } },
      include: this.jobDetailInclude(),
    })

    return job ? this.toJobDetailResult(job) : null
  }

  async getJobHistory(
    driverId: string,
    query: GetDriverJobsQueryDto
  ): Promise<{ data: AvailableJobItem[]; meta: PaginationMeta }> {
    const driverProfile = await this.getDriverProfileOrThrow(driverId)
    const { page, limit } = query

    const where: Prisma.DeliveryJobWhereInput = {
      driver_id: driverProfile.id,
      order: { status: JOB_COMPLETED_STATUS },
    }

    const [jobs, total] = await Promise.all([
      prisma.deliveryJob.findMany({
        where,
        orderBy: { completed_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          order: { include: { delivery_address: { select: { city: true } } } },
        },
      }),
      prisma.deliveryJob.count({ where }),
    ])

    return {
      data: jobs.map((job) => ({
        id: job.id,
        order_id: job.order_id,
        delivery_method: job.order.delivery_method,
        estimated_earning: Number(job.earning ?? 0),
        destination_city: job.order.delivery_address.city,
        delivery_fee: Number(job.order.delivery_fee),
        created_at: job.created_at,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getJobDetail(driverId: string, jobId: string): Promise<JobDetailResult> {
    const driverProfile = await this.getDriverProfileOrThrow(driverId)

    const job = await prisma.deliveryJob.findUnique({
      where: { id: jobId },
      include: this.jobDetailInclude(),
    })
    if (!job) {
      throw new NotFoundError('Pekerjaan tidak ditemukan')
    }
    if (job.driver_id !== null && job.driver_id !== driverProfile.id) {
      throw new ForbiddenError('Pekerjaan ini sudah diambil driver lain')
    }

    return this.toJobDetailResult(job)
  }

  async takeJob(driverId: string, jobId: string): Promise<JobDetailResult> {
    const driverProfile = await this.getDriverProfileOrThrow(driverId)

    await prisma.$transaction(async (tx) => {
      const existingActiveJob = await tx.deliveryJob.findFirst({
        where: { driver_id: driverProfile.id, order: { status: JOB_ACTIVE_STATUS } },
      })
      if (existingActiveJob) {
        throw new ConflictError('Kamu masih punya pekerjaan aktif yang belum diselesaikan')
      }

      const locked = await tx.$queryRaw<DeliveryJobRow[]>`
        SELECT id, order_id, driver_id FROM "DeliveryJob"
        WHERE id = ${jobId} AND driver_id IS NULL
        FOR UPDATE SKIP LOCKED
      `

      if (locked.length === 0) {
        throw new ConflictError('Job sudah diambil driver lain')
      }

      const lockedJob = locked[0]

      const order = await tx.order.findUnique({ where: { id: lockedJob.order_id } })
      if (!order || order.status !== JOB_AVAILABLE_STATUS) {
        throw new ConflictError('Job sudah diambil driver lain')
      }

      await tx.deliveryJob.update({
        where: { id: jobId },
        data: { driver_id: driverProfile.id, taken_at: new Date() },
      })

      await tx.order.update({
        where: { id: lockedJob.order_id },
        data: { status: JOB_ACTIVE_STATUS },
      })

      await tx.orderStatusHistory.create({
        data: { order_id: lockedJob.order_id, status: JOB_ACTIVE_STATUS, note: 'Driver mengambil pekerjaan' },
      })
    })

    return this.getJobDetail(driverId, jobId)
  }

  async completeJob(driverId: string, jobId: string): Promise<JobDetailResult> {
    const driverProfile = await this.getDriverProfileOrThrow(driverId)

    const job = await prisma.deliveryJob.findUnique({
      where: { id: jobId },
      include: { order: true },
    })
    if (!job) {
      throw new NotFoundError('Pekerjaan tidak ditemukan')
    }
    if (job.driver_id !== driverProfile.id) {
      throw new ForbiddenError('Pekerjaan ini bukan milik kamu')
    }
    if (job.order.status !== JOB_ACTIVE_STATUS) {
      throw new BadRequestError(`Pekerjaan tidak dapat diselesaikan dari status saat ini (${job.order.status})`)
    }

    const earning = calculateDriverEarning(job.order.delivery_method as DeliveryMethod)

    await prisma.$transaction(async (tx) => {
      await tx.deliveryJob.update({
        where: { id: jobId },
        data: { completed_at: new Date(), earning },
      })

      await tx.driverProfile.update({
        where: { id: driverProfile.id },
        data: { total_earnings: { increment: earning } },
      })

      await tx.order.update({
        where: { id: job.order_id },
        data: { status: JOB_COMPLETED_STATUS },
      })

      await tx.orderStatusHistory.create({
        data: { order_id: job.order_id, status: JOB_COMPLETED_STATUS, note: 'Pengiriman selesai dikonfirmasi driver' },
      })
    })

    return this.getJobDetail(driverId, jobId)
  }

  async getEarnings(driverId: string, query: GetDriverEarningsQueryDto): Promise<DriverEarningsResult> {
    const driverProfile = await this.getDriverProfileOrThrow(driverId)
    const { from_date, to_date } = query

    const where: Prisma.DeliveryJobWhereInput = {
      driver_id: driverProfile.id,
      completed_at: {
        not: null,
        ...(from_date ? { gte: new Date(from_date) } : {}),
        ...(to_date ? { lte: new Date(to_date) } : {}),
      },
    }

    const jobs = await prisma.deliveryJob.findMany({
      where,
      orderBy: { completed_at: 'desc' },
      include: { order: { select: { delivery_method: true } } },
    })

    const totalEarnings = jobs.reduce((sum, job) => sum + Number(job.earning ?? 0), 0)

    return {
      total_earnings: totalEarnings,
      completed_jobs_count: jobs.length,
      from_date: from_date ?? null,
      to_date: to_date ?? null,
      jobs: jobs.map((job) => ({
        job_id: job.id,
        order_id: job.order_id,
        delivery_method: job.order.delivery_method,
        earning: Number(job.earning ?? 0),
        completed_at: job.completed_at,
      })),
    }
  }

  private async getDriverProfileOrThrow(userId: string): Promise<{ id: string }> {
    const driverProfile = await prisma.driverProfile.findUnique({ where: { user_id: userId } })
    if (!driverProfile) {
      throw new BadRequestError('Akun ini tidak memiliki profil driver')
    }
    return driverProfile
  }

  private jobDetailInclude() {
    return {
      order: {
        include: {
          delivery_address: true,
          order_items: true,
          status_history: { orderBy: { created_at: 'asc' as const } },
        },
      },
    }
  }

  private toJobDetailResult(job: {
    id: string
    order_id: string
    driver_id: string | null
    earning: Prisma.Decimal | null
    taken_at: Date | null
    completed_at: Date | null
    created_at: Date
    order: {
      status: string
      delivery_method: string
      delivery_fee: Prisma.Decimal
      delivery_address: {
        label: string
        recipient_name: string
        phone: string
        street: string
        city: string
        province: string
        postal_code: string
      }
      order_items: {
        id: string
        product_id: string
        product_name: string
        product_price: Prisma.Decimal
        quantity: number
        subtotal: Prisma.Decimal
      }[]
      status_history: { id: string; status: string; note: string | null; created_at: Date }[]
    }
  }): JobDetailResult {
    return {
      id: job.id,
      order_id: job.order_id,
      driver_id: job.driver_id,
      status: job.order.status,
      delivery_method: job.order.delivery_method,
      delivery_fee: Number(job.order.delivery_fee),
      estimated_earning: calculateDriverEarning(job.order.delivery_method as DeliveryMethod),
      earning: job.earning !== null ? Number(job.earning) : null,
      taken_at: job.taken_at,
      completed_at: job.completed_at,
      address: {
        label: job.order.delivery_address.label,
        recipient_name: job.order.delivery_address.recipient_name,
        phone: job.order.delivery_address.phone,
        street: job.order.delivery_address.street,
        city: job.order.delivery_address.city,
        province: job.order.delivery_address.province,
        postal_code: job.order.delivery_address.postal_code,
      },
      order_items: job.order.order_items.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_price: Number(item.product_price),
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
      })),
      status_history: job.order.status_history.map((h) => ({
        id: h.id,
        status: h.status,
        note: h.note,
        created_at: h.created_at,
      })),
      created_at: job.created_at,
    }
  }
}

export const driverService = new DriverService()
