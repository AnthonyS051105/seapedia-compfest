import { Request, Response, NextFunction, CookieOptions } from 'express'
import { authService } from '../services/auth.service'
import { success } from '../utils/response'
import { AuthRequest, Role } from '../middleware/authenticate'
import { RegisterDto, LoginDto, SelectRoleDto } from '../schemas/auth.schema'
import { UnauthorizedError } from '../utils/errors'
import { getRefreshTokenExpiryMs } from '../utils/jwt'

const REFRESH_COOKIE_NAME = 'seapedia_refresh_token'

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: getRefreshTokenExpiryMs(),
  }
}

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dto = req.body as RegisterDto
    const user = await authService.register(dto)
    success(res, user, 'Akun berhasil dibuat', 201)
  } catch (error) {
    next(error)
  }
}

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dto = req.body as LoginDto
    const result = await authService.login(dto)

    res.cookie(REFRESH_COOKIE_NAME, result.refresh_token, refreshCookieOptions())

    success(res, {
      access_token: result.access_token,
      token_type: result.token_type,
      expires_in: result.expires_in,
      user: result.user,
    })
  } catch (error) {
    next(error)
  }
}

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined
    if (refreshToken) {
      await authService.logout(refreshToken)
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' })
    success(res, null, 'Logout berhasil')
  } catch (error) {
    next(error)
  }
}

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token tidak ditemukan')
    }
    const result = await authService.refresh(refreshToken)
    success(res, result)
  } catch (error) {
    next(error)
  }
}

export const selectRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role } = req.body as SelectRoleDto
    const userId = (req as AuthRequest).user.sub
    const result = await authService.selectRole(userId, role as Role)
    success(res, result, 'Peran berhasil dipilih')
  } catch (error) {
    next(error)
  }
}

export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthRequest
    const result = await authService.getMe(authReq.user.sub, authReq.user.active_role)
    success(res, result)
  } catch (error) {
    next(error)
  }
}
