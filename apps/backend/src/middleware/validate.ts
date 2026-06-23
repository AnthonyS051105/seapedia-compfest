import { Request, Response, NextFunction } from 'express'
import { z, ZodError } from 'zod'

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        next(err)
        return
      }
      next(err)
    }
  }
}

export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query)
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        next(err)
        return
      }
      next(err)
    }
  }
}
