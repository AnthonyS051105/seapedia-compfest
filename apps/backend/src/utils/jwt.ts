import jwt, { SignOptions } from 'jsonwebtoken'
import { Role } from '../middleware/authenticate'

export interface AccessTokenPayload {
  sub: string
  username: string
  email: string
  roles: Role[]
  active_role: Role | null
}

export interface RefreshTokenPayload {
  sub: string
  jti: string
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const secret = process.env.JWT_SECRET as string
  const expiresIn = (process.env.JWT_ACCESS_EXPIRY ?? '15m') as SignOptions['expiresIn']
  return jwt.sign(payload, secret, { expiresIn })
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  const secret = process.env.JWT_REFRESH_SECRET as string
  const expiresIn = (process.env.JWT_REFRESH_EXPIRY ?? '7d') as SignOptions['expiresIn']
  return jwt.sign(payload, secret, { expiresIn })
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const secret = process.env.JWT_REFRESH_SECRET as string
  return jwt.verify(token, secret) as RefreshTokenPayload
}

export function getAccessTokenExpirySeconds(): number {
  const expiry = process.env.JWT_ACCESS_EXPIRY ?? '15m'
  const match = expiry.match(/^(\d+)([smhd])$/)
  if (!match) return 900
  const value = parseInt(match[1], 10)
  const unit = match[2]
  const multiplier = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400
  return value * multiplier
}

export function getRefreshTokenExpiryMs(): number {
  const expiry = process.env.JWT_REFRESH_EXPIRY ?? '7d'
  const match = expiry.match(/^(\d+)([smhd])$/)
  if (!match) return 7 * 24 * 60 * 60 * 1000
  const value = parseInt(match[1], 10)
  const unit = match[2]
  const multiplier = unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000
  return value * multiplier
}
