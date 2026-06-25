import { Request, Response, NextFunction } from 'express'
import { ForbiddenError } from '../utils/errors'
import { AuthRequest, Role } from './authenticate'

export function requireRole(role: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if ((req as AuthRequest).user.active_role !== role) {
      throw new ForbiddenError(`Requires ${role} role`)
    }
    next()
  }
}
