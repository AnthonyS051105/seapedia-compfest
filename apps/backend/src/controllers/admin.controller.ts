import { Request, Response, NextFunction } from 'express'
import { discountService } from '../services/discount.service'
import { overdueService } from '../services/overdue.service'
import { success, paginated } from '../utils/response'
import { CreateVoucherDto, CreatePromoDto, GetDiscountsQueryDto } from '../schemas/discount.schema'

export const createVoucher = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dto = req.body as CreateVoucherDto
    const voucher = await discountService.createVoucher(dto)
    success(res, voucher, 'Voucher berhasil dibuat', 201)
  } catch (error) {
    next(error)
  }
}

export const getVouchers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = req.query as unknown as GetDiscountsQueryDto
    const { data, meta } = await discountService.getVouchers(query)
    paginated(res, data, meta)
  } catch (error) {
    next(error)
  }
}

export const getVoucherById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const voucher = await discountService.getVoucherById(id)
    success(res, voucher)
  } catch (error) {
    next(error)
  }
}

export const createPromo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dto = req.body as CreatePromoDto
    const promo = await discountService.createPromo(dto)
    success(res, promo, 'Promo berhasil dibuat', 201)
  } catch (error) {
    next(error)
  }
}

export const getPromos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = req.query as unknown as GetDiscountsQueryDto
    const { data, meta } = await discountService.getPromos(query)
    paginated(res, data, meta)
  } catch (error) {
    next(error)
  }
}

export const getPromoById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const promo = await discountService.getPromoById(id)
    success(res, promo)
  } catch (error) {
    next(error)
  }
}

export const simulateNextDay = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await overdueService.simulateNextDay()
    success(res, result, 'Simulasi hari berikutnya berhasil dijalankan')
  } catch (error) {
    next(error)
  }
}

export const processOverdue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const processedCount = await overdueService.processOverdueOrders()
    success(res, { processed_count: processedCount }, 'Pemrosesan overdue selesai')
  } catch (error) {
    next(error)
  }
}
