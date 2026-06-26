import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/authenticate'
import { walletService } from '../services/wallet.service'
import { addressService } from '../services/address.service'
import { cartService } from '../services/cart.service'
import { checkoutService } from '../services/checkout.service'
import { reportService } from '../services/report.service'
import { success, paginated } from '../utils/response'
import { TopUpDto, CreateAddressDto, UpdateAddressDto } from '../schemas/buyer.schema'
import { AddToCartDto, UpdateCartItemDto } from '../schemas/cart.schema'
import { CheckoutDto } from '../schemas/checkout.schema'
import { GetOrdersQueryDto, GetSpendingReportQueryDto } from '../schemas/order.schema'

interface PaginationQueryDto {
  page: number
  limit: number
}

export const getWallet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const query = req.query as unknown as PaginationQueryDto
    const wallet = await walletService.getWallet(userId, query)
    success(res, wallet)
  } catch (error) {
    next(error)
  }
}

export const topUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const { amount } = req.body as TopUpDto
    const result = await walletService.topUp(userId, amount)
    success(res, result, 'Top up berhasil')
  } catch (error) {
    next(error)
  }
}

export const getAddresses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const addresses = await addressService.getAddresses(userId)
    success(res, addresses)
  } catch (error) {
    next(error)
  }
}

export const createAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const dto = req.body as CreateAddressDto
    const address = await addressService.createAddress(userId, dto)
    success(res, address, 'Alamat berhasil ditambahkan', 201)
  } catch (error) {
    next(error)
  }
}

export const updateAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const { id } = req.params
    const dto = req.body as UpdateAddressDto
    const address = await addressService.updateAddress(userId, id, dto)
    success(res, address, 'Alamat berhasil diperbarui')
  } catch (error) {
    next(error)
  }
}

export const deleteAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const { id } = req.params
    await addressService.deleteAddress(userId, id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

export const setDefaultAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const { id } = req.params
    const address = await addressService.setDefault(userId, id)
    success(res, address, 'Alamat default berhasil diperbarui')
  } catch (error) {
    next(error)
  }
}

export const getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const cart = await cartService.getCart(userId)
    success(res, cart)
  } catch (error) {
    next(error)
  }
}

export const addToCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const { product_id, quantity } = req.body as AddToCartDto
    const cart = await cartService.addToCart(userId, product_id, quantity)
    success(res, cart, 'Produk berhasil ditambahkan ke keranjang')
  } catch (error) {
    next(error)
  }
}

export const updateCartItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const { itemId } = req.params
    const { quantity } = req.body as UpdateCartItemDto
    const cart = await cartService.updateCartItem(userId, itemId, quantity)
    success(res, cart, 'Jumlah produk berhasil diperbarui')
  } catch (error) {
    next(error)
  }
}

export const removeCartItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const { itemId } = req.params
    const cart = await cartService.removeCartItem(userId, itemId)
    success(res, cart, 'Item berhasil dihapus dari keranjang')
  } catch (error) {
    next(error)
  }
}

export const clearCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    await cartService.clearCart(userId)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

export const previewCheckout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const dto = req.body as CheckoutDto
    const preview = await checkoutService.previewCheckout(userId, dto)
    success(res, preview)
  } catch (error) {
    next(error)
  }
}

export const checkout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const dto = req.body as CheckoutDto
    const order = await checkoutService.checkout(userId, dto)
    success(res, order, 'Pesanan berhasil dibuat', 201)
  } catch (error) {
    next(error)
  }
}

export const getOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const query = req.query as unknown as GetOrdersQueryDto
    const { data, meta } = await checkoutService.getOrders(userId, query)
    paginated(res, data, meta)
  } catch (error) {
    next(error)
  }
}

export const getOrderDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const { id } = req.params
    const order = await checkoutService.getOrderDetail(userId, id)
    success(res, order)
  } catch (error) {
    next(error)
  }
}

export const getSpendingReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const query = req.query as unknown as GetSpendingReportQueryDto
    const report = await reportService.getSpendingReport(userId, query)
    success(res, report)
  } catch (error) {
    next(error)
  }
}
