import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UnauthorizedError } from '../utils/errors'

export type Role = 'ADMIN' | 'SELLER' | 'BUYER' | 'DRIVER'

export interface AccessTokenPayload {
  sub: string
  username: string
  email: string
  roles: Role[]
  active_role: Role | null
  iat: number
  exp: number
}

export interface AuthRequest extends Request {
  user: AccessTokenPayload
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined

  if (!token) {
    throw new UnauthorizedError('No token provided')
  }

  try {
    const secret = process.env.JWT_SECRET as string
    const payload = jwt.verify(token, secret) as AccessTokenPayload
    ;(req as AuthRequest).user = payload
    next()
  } catch {
    throw new UnauthorizedError('Invalid or expired token')
  }
}
