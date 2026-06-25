import { Prisma } from '@prisma/client'
import { prisma } from '../prisma/client'
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors'

export interface CartItemResult {
  id: string
  product_id: string
  product_name: string
  product_price: number
  product_stock: number
  quantity: number
  subtotal: number
}

export interface StoreInfo {
  id: string
  name: string
}

export interface CartResult {
  store: StoreInfo | null
  items: CartItemResult[]
  subtotal: number
}

export interface CartConflictData {
  current_store: StoreInfo
  requested_store: StoreInfo
}

interface CartItemRow {
  id: string
  product_id: string
  quantity: number
  product: {
    name: string
    price: Prisma.Decimal
    stock: number
    store_id: string
    store: { id: string; name: string }
  }
}

class CartService {
  async getCart(userId: string): Promise<CartResult> {
    const buyerProfile = await this.getBuyerProfileOrThrow(userId)
    const items = await this.findCartItems(buyerProfile.id)

    return this.toCartResult(items)
  }

  async addToCart(userId: string, productId: string, quantity: number): Promise<CartResult> {
    const buyerProfile = await this.getBuyerProfileOrThrow(userId)

    const product = await prisma.product.findFirst({
      where: { id: productId, deleted_at: null },
      include: { store: { select: { id: true, name: true } } },
    })
    if (!product) {
      throw new NotFoundError('Produk tidak ditemukan')
    }

    const existingItems = await this.findCartItems(buyerProfile.id)

    if (existingItems.length > 0) {
      const currentStore = existingItems[0].product.store
      if (currentStore.id !== product.store_id) {
        const conflictData: CartConflictData = {
          current_store: { id: currentStore.id, name: currentStore.name },
          requested_store: { id: product.store.id, name: product.store.name },
        }
        throw new ConflictError(
          `Keranjangmu sudah berisi produk dari '${currentStore.name}'. Kosongkan keranjang terlebih dahulu untuk membeli dari toko lain.`,
          conflictData
        )
      }
    }

    const existingItem = existingItems.find((item) => item.product_id === productId)

    if (existingItem) {
      const newQuantity = Math.min(existingItem.quantity + quantity, product.stock)
      if (newQuantity > product.stock) {
        throw new BadRequestError('Stok produk tidak mencukupi')
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      })
    } else {
      if (quantity > product.stock) {
        throw new BadRequestError('Stok produk tidak mencukupi')
      }

      await prisma.cartItem.create({
        data: {
          buyer_id: buyerProfile.id,
          product_id: productId,
          quantity,
        },
      })
    }

    const updatedItems = await this.findCartItems(buyerProfile.id)
    return this.toCartResult(updatedItems)
  }

  async updateCartItem(userId: string, cartItemId: string, quantity: number): Promise<CartResult> {
    const buyerProfile = await this.getBuyerProfileOrThrow(userId)
    const item = await this.getOwnedCartItemOrThrow(buyerProfile.id, cartItemId)

    if (quantity > item.product.stock) {
      throw new BadRequestError('Stok produk tidak mencukupi')
    }

    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    })

    const updatedItems = await this.findCartItems(buyerProfile.id)
    return this.toCartResult(updatedItems)
  }

  async removeCartItem(userId: string, cartItemId: string): Promise<CartResult> {
    const buyerProfile = await this.getBuyerProfileOrThrow(userId)
    const item = await this.getOwnedCartItemOrThrow(buyerProfile.id, cartItemId)

    await prisma.cartItem.delete({ where: { id: item.id } })

    const updatedItems = await this.findCartItems(buyerProfile.id)
    return this.toCartResult(updatedItems)
  }

  async clearCart(userId: string): Promise<void> {
    const buyerProfile = await this.getBuyerProfileOrThrow(userId)
    await prisma.cartItem.deleteMany({ where: { buyer_id: buyerProfile.id } })
  }

  private async findCartItems(buyerId: string): Promise<CartItemRow[]> {
    return prisma.cartItem.findMany({
      where: { buyer_id: buyerId },
      orderBy: { created_at: 'asc' },
      include: {
        product: {
          select: {
            name: true,
            price: true,
            stock: true,
            store_id: true,
            store: { select: { id: true, name: true } },
          },
        },
      },
    })
  }

  private async getBuyerProfileOrThrow(userId: string): Promise<{ id: string }> {
    const buyerProfile = await prisma.buyerProfile.findUnique({ where: { user_id: userId } })
    if (!buyerProfile) {
      throw new BadRequestError('Akun ini tidak memiliki profil pembeli')
    }
    return buyerProfile
  }

  private async getOwnedCartItemOrThrow(buyerId: string, cartItemId: string): Promise<CartItemRow> {
    const item = await prisma.cartItem.findFirst({
      where: { id: cartItemId, buyer_id: buyerId },
      include: {
        product: {
          select: {
            name: true,
            price: true,
            stock: true,
            store_id: true,
            store: { select: { id: true, name: true } },
          },
        },
      },
    })
    if (!item) {
      throw new NotFoundError('Item keranjang tidak ditemukan')
    }
    return item
  }

  private toCartResult(items: CartItemRow[]): CartResult {
    const cartItems: CartItemResult[] = items.map((item) => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product.name,
      product_price: Number(item.product.price),
      product_stock: item.product.stock,
      quantity: item.quantity,
      subtotal: Number(item.product.price) * item.quantity,
    }))

    const store: StoreInfo | null =
      items.length > 0 ? { id: items[0].product.store.id, name: items[0].product.store.name } : null

    const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0)

    return { store, items: cartItems, subtotal }
  }
}

export const cartService = new CartService()
