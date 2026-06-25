import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/authenticate'
import { sellerService } from '../services/seller.service'
import { success, paginated } from '../utils/response'
import { CreateStoreDto, UpdateStoreDto } from '../schemas/store.schema'
import { CreateProductDto, UpdateProductDto } from '../schemas/product.schema'
import { GetOrdersQueryDto, GetIncomeReportQueryDto } from '../schemas/order.schema'

interface PaginationQueryDto {
  page: number
  limit: number
}

export const createStore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const dto = req.body as CreateStoreDto
    const store = await sellerService.createStore(userId, dto)
    success(res, store, 'Toko berhasil dibuat', 201)
  } catch (error) {
    next(error)
  }
}

export const updateStore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const dto = req.body as UpdateStoreDto
    const store = await sellerService.updateStore(userId, dto)
    success(res, store, 'Toko berhasil diperbarui')
  } catch (error) {
    next(error)
  }
}

export const getMyStore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const store = await sellerService.getMyStore(userId)
    success(res, store)
  } catch (error) {
    next(error)
  }
}

export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const dto = req.body as CreateProductDto
    const product = await sellerService.createProduct(userId, dto)
    success(res, product, 'Produk berhasil dibuat', 201)
  } catch (error) {
    next(error)
  }
}

export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const { id } = req.params
    const dto = req.body as UpdateProductDto
    const product = await sellerService.updateProduct(userId, id, dto)
    success(res, product, 'Produk berhasil diperbarui')
  } catch (error) {
    next(error)
  }
}

export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const { id } = req.params
    await sellerService.deleteProduct(userId, id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

export const getMyProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const query = req.query as unknown as PaginationQueryDto
    const { data, meta } = await sellerService.getMyProducts(userId, query)
    paginated(res, data, meta)
  } catch (error) {
    next(error)
  }
}

export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const { id } = req.params
    const product = await sellerService.getProductById(userId, id)
    success(res, product)
  } catch (error) {
    next(error)
  }
}

export const getIncomingOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const query = req.query as unknown as GetOrdersQueryDto
    const { data, meta } = await sellerService.getIncomingOrders(userId, query)
    paginated(res, data, meta)
  } catch (error) {
    next(error)
  }
}

export const getOrderDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const { id } = req.params
    const order = await sellerService.getOrderDetail(userId, id)
    success(res, order)
  } catch (error) {
    next(error)
  }
}

export const processOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const { id } = req.params
    const order = await sellerService.processOrder(userId, id)
    success(res, order, 'Pesanan berhasil diproses')
  } catch (error) {
    next(error)
  }
}

export const getIncomeReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const query = req.query as unknown as GetIncomeReportQueryDto
    const report = await sellerService.getIncomeReport(userId, query)
    success(res, report)
  } catch (error) {
    next(error)
  }
}
