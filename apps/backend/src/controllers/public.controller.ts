import { Request, Response, NextFunction } from 'express'
import { catalogService } from '../services/catalog.service'
import { reviewService } from '../services/review.service'
import { success, paginated } from '../utils/response'
import { GetProductsQueryDto } from '../schemas/product.schema'
import { CreateReviewDto } from '../schemas/review.schema'

interface PaginationQueryDto {
  page: number
  limit: number
}

export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = req.query as unknown as GetProductsQueryDto
    const { data, meta } = await catalogService.getProducts(query)
    paginated(res, data, meta)
  } catch (error) {
    next(error)
  }
}

export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const product = await catalogService.getProductById(id)
    success(res, product)
  } catch (error) {
    next(error)
  }
}

export const getStores = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = req.query as unknown as PaginationQueryDto
    const { data, meta } = await catalogService.getStores(query)
    paginated(res, data, meta)
  } catch (error) {
    next(error)
  }
}

export const getStoreById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const query = req.query as unknown as PaginationQueryDto
    const store = await catalogService.getStoreById(id, query)
    success(res, store)
  } catch (error) {
    next(error)
  }
}

export const createReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dto = req.body as CreateReviewDto
    const review = await reviewService.createReview(dto)
    success(res, review, 'Review berhasil dikirim', 201)
  } catch (error) {
    next(error)
  }
}

export const getReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = req.query as unknown as PaginationQueryDto
    const { data, meta } = await reviewService.getReviews(query)
    paginated(res, data, meta)
  } catch (error) {
    next(error)
  }
}
