import { Prisma } from '@prisma/client'
import { prisma } from '../prisma/client'
import { CreateStoreDto, UpdateStoreDto } from '../schemas/store.schema'
import { CreateProductDto, UpdateProductDto } from '../schemas/product.schema'
import { GetOrdersQueryDto } from '../schemas/order.schema'
import { sanitizeText } from '../utils/sanitize'
import { ConflictError, NotFoundError, BadRequestError } from '../utils/errors'
import { PaginationMeta } from '../utils/response'

export interface StoreResult {
  id: string
  name: string
  description: string | null
  address: string | null
  logo_url: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface SellerProductResult {
  id: string
  store_id: string
  name: string
  description: string | null
  price: number
  stock: number
  images: string[]
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface OrderListItem {
  id: string
  buyer_id: string
  status: string
  delivery_method: string
  subtotal: number
  discount_amount: number
  delivery_fee: number
  ppn_amount: number
  final_total: number
  created_at: Date
}

export interface OrderStatusHistoryItem {
  id: string
  status: string
  note: string | null
  created_at: Date
}

export interface OrderItemDetail {
  id: string
  product_id: string
  product_name: string
  product_price: number
  quantity: number
  subtotal: number
}

export interface OrderDetailResult extends OrderListItem {
  address_id: string
  discount_code: string | null
  discount_type: string | null
  order_items: OrderItemDetail[]
  status_history: OrderStatusHistoryItem[]
}

interface ProductRow {
  id: string
  store_id: string
  name: string
  description: string | null
  price: Prisma.Decimal
  stock: number
  images: string[]
  is_active: boolean
  created_at: Date
  updated_at: Date
}

interface StoreRow {
  id: string
  name: string
  description: string | null
  address: string | null
  logo_url: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

class SellerService {
  async createStore(userId: string, dto: CreateStoreDto): Promise<StoreResult> {
    const sellerProfile = await this.getSellerProfileOrThrow(userId)

    const existingStore = await prisma.store.findUnique({ where: { seller_id: sellerProfile.id } })
    if (existingStore) {
      throw new ConflictError('Kamu sudah memiliki toko. Setiap penjual hanya boleh memiliki 1 toko.')
    }

    const nameTaken = await prisma.store.findFirst({
      where: { name: { equals: dto.name, mode: 'insensitive' } },
    })
    if (nameTaken) {
      throw new ConflictError('Nama toko sudah digunakan, silakan pilih nama lain.')
    }

    const store = await prisma.store.create({
      data: {
        seller_id: sellerProfile.id,
        name: sanitizeText(dto.name),
        description: dto.description ? sanitizeText(dto.description) : undefined,
        address: dto.address ? sanitizeText(dto.address) : undefined,
        logo_url: dto.logo_url,
      },
    })

    return this.toStoreResult(store)
  }

  async updateStore(userId: string, dto: UpdateStoreDto): Promise<StoreResult> {
    const sellerProfile = await this.getSellerProfileOrThrow(userId)

    const store = await prisma.store.findUnique({ where: { seller_id: sellerProfile.id } })
    if (!store) {
      throw new NotFoundError('Toko tidak ditemukan. Buat toko terlebih dahulu.')
    }

    if (dto.name && dto.name.toLowerCase() !== store.name.toLowerCase()) {
      const nameTaken = await prisma.store.findFirst({
        where: { name: { equals: dto.name, mode: 'insensitive' }, id: { not: store.id } },
      })
      if (nameTaken) {
        throw new ConflictError('Nama toko sudah digunakan, silakan pilih nama lain.')
      }
    }

    const updated = await prisma.store.update({
      where: { id: store.id },
      data: {
        ...(dto.name !== undefined ? { name: sanitizeText(dto.name) } : {}),
        ...(dto.description !== undefined ? { description: sanitizeText(dto.description) } : {}),
        ...(dto.address !== undefined ? { address: sanitizeText(dto.address) } : {}),
        ...(dto.logo_url !== undefined ? { logo_url: dto.logo_url } : {}),
      },
    })

    return this.toStoreResult(updated)
  }

  async getMyStore(userId: string): Promise<StoreResult | null> {
    const sellerProfile = await this.getSellerProfileOrThrow(userId)
    const store = await prisma.store.findUnique({ where: { seller_id: sellerProfile.id } })
    return store ? this.toStoreResult(store) : null
  }

  async createProduct(userId: string, dto: CreateProductDto): Promise<SellerProductResult> {
    const store = await this.getOwnStoreOrThrow(userId)

    const product = await prisma.product.create({
      data: {
        store_id: store.id,
        name: sanitizeText(dto.name),
        description: dto.description ? sanitizeText(dto.description) : undefined,
        price: dto.price,
        stock: dto.stock,
        images: dto.images,
      },
    })

    return this.toProductResult(product)
  }

  async updateProduct(userId: string, productId: string, dto: UpdateProductDto): Promise<SellerProductResult> {
    const store = await this.getOwnStoreOrThrow(userId)
    const product = await this.getOwnedProductOrThrow(store.id, productId)

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        ...(dto.name !== undefined ? { name: sanitizeText(dto.name) } : {}),
        ...(dto.description !== undefined ? { description: sanitizeText(dto.description) } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.stock !== undefined ? { stock: dto.stock } : {}),
        ...(dto.images !== undefined ? { images: dto.images } : {}),
      },
    })

    return this.toProductResult(updated)
  }

  async deleteProduct(userId: string, productId: string): Promise<void> {
    const store = await this.getOwnStoreOrThrow(userId)
    const product = await this.getOwnedProductOrThrow(store.id, productId)

    await prisma.product.update({
      where: { id: product.id },
      data: { deleted_at: new Date(), is_active: false },
    })
  }

  async getMyProducts(
    userId: string,
    query: { page: number; limit: number }
  ): Promise<{ data: SellerProductResult[]; meta: PaginationMeta }> {
    const store = await this.getOwnStoreOrThrow(userId)
    const { page, limit } = query

    const where: Prisma.ProductWhereInput = { store_id: store.id, deleted_at: null }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return {
      data: products.map((p) => this.toProductResult(p)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getProductById(userId: string, productId: string): Promise<SellerProductResult> {
    const store = await this.getOwnStoreOrThrow(userId)
    const product = await this.getOwnedProductOrThrow(store.id, productId)
    return this.toProductResult(product)
  }

  async getIncomingOrders(
    userId: string,
    query: GetOrdersQueryDto
  ): Promise<{ data: OrderListItem[]; meta: PaginationMeta }> {
    const store = await this.getOwnStoreOrThrow(userId)
    const { page, limit, status } = query

    const where: Prisma.OrderWhereInput = {
      store_id: store.id,
      ...(status ? { status } : {}),
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
      data: orders.map((o) => this.toOrderListItem(o)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getOrderDetail(userId: string, orderId: string): Promise<OrderDetailResult> {
    const store = await this.getOwnStoreOrThrow(userId)

    const order = await prisma.order.findFirst({
      where: { id: orderId, store_id: store.id },
      include: {
        order_items: true,
        status_history: { orderBy: { created_at: 'asc' } },
      },
    })
    if (!order) {
      throw new NotFoundError('Pesanan tidak ditemukan')
    }

    return {
      ...this.toOrderListItem(order),
      address_id: order.address_id,
      discount_code: order.discount_code,
      discount_type: order.discount_type,
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

  private async getSellerProfileOrThrow(userId: string): Promise<{ id: string }> {
    const sellerProfile = await prisma.sellerProfile.findUnique({ where: { user_id: userId } })
    if (!sellerProfile) {
      throw new BadRequestError('Akun ini tidak memiliki profil penjual')
    }
    return sellerProfile
  }

  private async getOwnStoreOrThrow(userId: string): Promise<StoreRow> {
    const sellerProfile = await this.getSellerProfileOrThrow(userId)
    const store = await prisma.store.findUnique({ where: { seller_id: sellerProfile.id } })
    if (!store) {
      throw new BadRequestError('Kamu belum memiliki toko. Buat toko terlebih dahulu.')
    }
    return store
  }

  private async getOwnedProductOrThrow(storeId: string, productId: string): Promise<ProductRow> {
    const product = await prisma.product.findFirst({ where: { id: productId, deleted_at: null } })
    if (!product) {
      throw new NotFoundError('Produk tidak ditemukan')
    }
    if (product.store_id !== storeId) {
      throw new NotFoundError('Produk tidak ditemukan')
    }
    return product
  }

  private toStoreResult(store: StoreRow): StoreResult {
    return {
      id: store.id,
      name: store.name,
      description: store.description,
      address: store.address,
      logo_url: store.logo_url,
      is_active: store.is_active,
      created_at: store.created_at,
      updated_at: store.updated_at,
    }
  }

  private toProductResult(product: ProductRow): SellerProductResult {
    return {
      id: product.id,
      store_id: product.store_id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      stock: product.stock,
      images: product.images,
      is_active: product.is_active,
      created_at: product.created_at,
      updated_at: product.updated_at,
    }
  }

  private toOrderListItem(order: {
    id: string
    buyer_id: string
    status: string
    delivery_method: string
    subtotal: Prisma.Decimal
    discount_amount: Prisma.Decimal
    delivery_fee: Prisma.Decimal
    ppn_amount: Prisma.Decimal
    final_total: Prisma.Decimal
    created_at: Date
  }): OrderListItem {
    return {
      id: order.id,
      buyer_id: order.buyer_id,
      status: order.status,
      delivery_method: order.delivery_method,
      subtotal: Number(order.subtotal),
      discount_amount: Number(order.discount_amount),
      delivery_fee: Number(order.delivery_fee),
      ppn_amount: Number(order.ppn_amount),
      final_total: Number(order.final_total),
      created_at: order.created_at,
    }
  }
}

export const sellerService = new SellerService()
