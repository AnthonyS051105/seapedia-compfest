import { Response } from 'express'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function success<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    data,
  })
}

export function paginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  statusCode: number = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    meta,
  })
}
