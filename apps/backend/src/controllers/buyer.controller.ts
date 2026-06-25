import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/authenticate'
import { walletService } from '../services/wallet.service'
import { addressService } from '../services/address.service'
import { success } from '../utils/response'
import { TopUpDto, CreateAddressDto, UpdateAddressDto } from '../schemas/buyer.schema'

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
