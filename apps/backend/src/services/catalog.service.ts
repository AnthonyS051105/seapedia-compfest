import { Prisma } from '@prisma/client'
import { prisma } from '../prisma/client'
import { GetProductsQueryDto } from '../schemas/product.schema'
import { NotFoundError } from '../utils/errors'
import { PaginationMeta } from '../utils/response'

export interface ProductStoreSummary {
  id: string
  name: string
  seller_id: string
}

export interface ProductListItem {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  images: string[]
  created_at: Date
  updated_at: Date
  store: ProductStoreSummary
}

export interface ProductDetail extends ProductListItem {
  is_active: boolean
}

export interface StoreListItem {
  id: string
  name: string
  description: string | null
  address: string | null
  logo_url: string | null
  created_at: Date
}

export interface StoreDetail extends StoreListItem {
  products: ProductListItem[]
  products_meta: PaginationMeta
}

export interface PaginationQuery {
  page: number
  limit: number
}

class CatalogService {
  async getProducts(
    query: GetProductsQueryDto
  ): Promise<{ data: ProductListItem[]; meta: PaginationMeta }> {
    const { page, limit, search, store_id, min_price, max_price, sort } = query

    const where: Prisma.ProductWhereInput = {
      deleted_at: null,
      ...(store_id ? { store_id } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(min_price !== undefined || max_price !== undefined
        ? {
            price: {
              ...(min_price !== undefined ? { gte: min_price } : {}),
              ...(max_price !== undefined ? { lte: max_price } : {}),
            },
          }
        : {}),
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === 'price_asc'
        ? { price: 'asc' }
        : sort === 'price_desc'
          ? { price: 'desc' }
          : { created_at: 'desc' }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { store: { select: { id: true, name: true, seller_id: true } } },
      }),
      prisma.product.count({ where }),
    ])

    return {
      data: products.map((p) => this.toProductListItem(p)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getProductById(id: string): Promise<ProductDetail> {
    const product = await prisma.product.findFirst({
      where: { id, deleted_at: null },
      include: { store: { select: { id: true, name: true, seller_id: true } } },
    })
    if (!product) {
      throw new NotFoundError('Produk tidak ditemukan')
    }

    return {
      ...this.toProductListItem(product),
      is_active: product.is_active,
    }
  }

  async getStores(
    query: PaginationQuery
  ): Promise<{ data: StoreListItem[]; meta: PaginationMeta }> {
    const { page, limit } = query
    const where: Prisma.StoreWhereInput = { is_active: true }

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.store.count({ where }),
    ])

    return {
      data: stores.map((s) => this.toStoreListItem(s)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getStoreById(id: string, query: PaginationQuery): Promise<StoreDetail> {
    const store = await prisma.store.findFirst({ where: { id, is_active: true } })
    if (!store) {
      throw new NotFoundError('Toko tidak ditemukan')
    }

    const { page, limit } = query
    const where: Prisma.ProductWhereInput = { store_id: id, deleted_at: null }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { store: { select: { id: true, name: true, seller_id: true } } },
      }),
      prisma.product.count({ where }),
    ])

    return {
      ...this.toStoreListItem(store),
      products: products.map((p) => this.toProductListItem(p)),
      products_meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  private toProductListItem(product: {
    id: string
    name: string
    description: string | null
    price: Prisma.Decimal
    stock: number
    images: string[]
    created_at: Date
    updated_at: Date
    store: ProductStoreSummary
  }): ProductListItem {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      stock: product.stock,
      images: product.images,
      created_at: product.created_at,
      updated_at: product.updated_at,
      store: product.store,
    }
  }

  private toStoreListItem(store: {
    id: string
    name: string
    description: string | null
    address: string | null
    logo_url: string | null
    created_at: Date
  }): StoreListItem {
    return {
      id: store.id,
      name: store.name,
      description: store.description,
      address: store.address,
      logo_url: store.logo_url,
      created_at: store.created_at,
    }
  }
}

export const catalogService = new CatalogService()
