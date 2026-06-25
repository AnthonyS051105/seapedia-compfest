import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/authenticate'
import { driverService } from '../services/driver.service'
import { success, paginated } from '../utils/response'
import { GetDriverJobsQueryDto, GetDriverEarningsQueryDto } from '../schemas/driver.schema'

export const getAvailableJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const query = req.query as unknown as GetDriverJobsQueryDto
    const { data, meta } = await driverService.getAvailableJobs(userId, query)
    paginated(res, data, meta)
  } catch (error) {
    next(error)
  }
}

export const getActiveJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const job = await driverService.getActiveJob(userId)
    success(res, job)
  } catch (error) {
    next(error)
  }
}

export const getJobHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const query = req.query as unknown as GetDriverJobsQueryDto
    const { data, meta } = await driverService.getJobHistory(userId, query)
    paginated(res, data, meta)
  } catch (error) {
    next(error)
  }
}

export const getJobDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const { id } = req.params
    const job = await driverService.getJobDetail(userId, id)
    success(res, job)
  } catch (error) {
    next(error)
  }
}

export const takeJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const { id } = req.params
    const job = await driverService.takeJob(userId, id)
    success(res, job, 'Pekerjaan berhasil diambil')
  } catch (error) {
    next(error)
  }
}

export const completeJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const { id } = req.params
    const job = await driverService.completeJob(userId, id)
    success(res, job, 'Pengiriman selesai dikonfirmasi')
  } catch (error) {
    next(error)
  }
}

export const getEarnings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.sub
    const query = req.query as unknown as GetDriverEarningsQueryDto
    const earnings = await driverService.getEarnings(userId, query)
    success(res, earnings)
  } catch (error) {
    next(error)
  }
}
