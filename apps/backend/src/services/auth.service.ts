import crypto from 'crypto'
import { prisma } from '../prisma/client'
import { hashPassword, comparePassword } from '../utils/bcrypt'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getAccessTokenExpirySeconds,
  getRefreshTokenExpiryMs,
  AccessTokenPayload,
} from '../utils/jwt'
import { Role } from '../middleware/authenticate'
import { RegisterDto, LoginDto } from '../schemas/auth.schema'
import { ConflictError, UnauthorizedError, NotFoundError, ForbiddenError } from '../utils/errors'

export interface RegisteredUser {
  id: string
  username: string
  email: string
  full_name: string | null
  roles: Role[]
}

export interface LoginResult {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token: string
  refresh_token_expires_at: Date
  user: {
    id: string
    username: string
    email: string
    roles: Role[]
    active_role: Role | null
  }
}

export interface MeResult {
  id: string
  username: string
  email: string
  full_name: string | null
  phone: string | null
  roles: Role[]
  active_role: Role | null
  wallet_balance: number | null
  seller_income: number | null
  driver_earnings: number | null
}

class AuthService {
  async register(dto: RegisterDto): Promise<RegisteredUser> {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    })
    if (existing) {
      throw new ConflictError('Username atau email sudah digunakan')
    }

    const hashed = await hashPassword(dto.password)

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          username: dto.username,
          email: dto.email,
          password: hashed,
          full_name: dto.full_name,
          phone: dto.phone,
          user_roles: {
            create: dto.roles.map((role) => ({ role })),
          },
        },
      })

      if (dto.roles.includes('BUYER')) {
        await tx.buyerProfile.create({ data: { user_id: createdUser.id } })
      }
      if (dto.roles.includes('SELLER')) {
        await tx.sellerProfile.create({ data: { user_id: createdUser.id } })
      }
      if (dto.roles.includes('DRIVER')) {
        await tx.driverProfile.create({ data: { user_id: createdUser.id } })
      }

      return createdUser
    })

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      roles: dto.roles,
    }
  }

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await prisma.user.findFirst({
      where: dto.email ? { email: dto.email } : { username: dto.username },
      include: { user_roles: true },
    })
    if (!user) {
      throw new UnauthorizedError('Email/username atau password salah')
    }

    const passwordMatches = await comparePassword(dto.password, user.password)
    if (!passwordMatches) {
      throw new UnauthorizedError('Email/username atau password salah')
    }

    const roles = user.user_roles.map((ur) => ur.role) as Role[]
    const activeRole = this.determineActiveRole(roles)

    const accessToken = signAccessToken({
      sub: user.id,
      username: user.username,
      email: user.email,
      roles,
      active_role: activeRole,
    })

    const jti = crypto.randomUUID()
    const refreshToken = signRefreshToken({ sub: user.id, jti })
    const expiresAt = new Date(Date.now() + getRefreshTokenExpiryMs())

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token: refreshToken,
        expires_at: expiresAt,
      },
    })

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: getAccessTokenExpirySeconds(),
      refresh_token: refreshToken,
      refresh_token_expires_at: expiresAt,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles,
        active_role: activeRole,
      },
    }
  }

  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, is_revoked: false },
      data: { is_revoked: true },
    })
  }

  async refresh(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    let payload
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch {
      throw new UnauthorizedError('Refresh token tidak valid atau sudah expired')
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!stored || stored.is_revoked) {
      throw new UnauthorizedError('Refresh token sudah direvoke')
    }
    if (stored.expires_at < new Date()) {
      throw new UnauthorizedError('Refresh token sudah expired')
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { user_roles: true },
    })
    if (!user) {
      throw new UnauthorizedError('User tidak ditemukan')
    }

    const roles = user.user_roles.map((ur) => ur.role) as Role[]
    const activeRole = this.determineActiveRole(roles)

    const accessToken = signAccessToken({
      sub: user.id,
      username: user.username,
      email: user.email,
      roles,
      active_role: activeRole,
    })

    return { access_token: accessToken, expires_in: getAccessTokenExpirySeconds() }
  }

  async selectRole(
    userId: string,
    role: Role
  ): Promise<{ access_token: string; expires_in: number; active_role: Role }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { user_roles: true },
    })
    if (!user) {
      throw new NotFoundError('User tidak ditemukan')
    }

    const roles = user.user_roles.map((ur) => ur.role) as Role[]
    if (!roles.includes(role)) {
      throw new ForbiddenError('User tidak memiliki peran yang diminta')
    }

    const accessToken = signAccessToken({
      sub: user.id,
      username: user.username,
      email: user.email,
      roles,
      active_role: role,
    })

    return { access_token: accessToken, expires_in: getAccessTokenExpirySeconds(), active_role: role }
  }

  async getMe(userId: string, activeRole: Role | null): Promise<MeResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        user_roles: true,
        buyer_profile: true,
        seller_profile: true,
        driver_profile: true,
      },
    })
    if (!user) {
      throw new NotFoundError('User tidak ditemukan')
    }

    const roles = user.user_roles.map((ur) => ur.role) as Role[]

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      roles,
      active_role: activeRole,
      wallet_balance: user.buyer_profile ? Number(user.buyer_profile.balance) : null,
      seller_income: user.seller_profile ? Number(user.seller_profile.total_income) : null,
      driver_earnings: user.driver_profile ? Number(user.driver_profile.total_earnings) : null,
    }
  }

  private determineActiveRole(roles: Role[]): Role | null {
    if (roles.includes('ADMIN')) {
      return 'ADMIN'
    }
    if (roles.length === 1) {
      return roles[0]
    }
    return null
  }
}

export const authService = new AuthService()
export type { AccessTokenPayload }
