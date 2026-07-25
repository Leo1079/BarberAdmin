import { prisma } from '../../config/database'
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './auth.utils'

export class AuthServiceError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
  }
}

export async function register(data: { email: string; password: string; role?: string }) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw new AuthServiceError('Email already registered', 409)

  const password = await hashPassword(data.password)
  const user = await prisma.user.create({
    data: { email: data.email, password, role: data.role as any },
    select: { id: true, email: true, role: true, createdAt: true },
  })

  return user
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new AuthServiceError('Email o contraseña incorrectos', 401)

  const valid = await comparePassword(password, user.password)
  if (!valid) throw new AuthServiceError('Email o contraseña incorrectos', 401)

  const payload = { id: user.id, role: user.role }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  return {
    user: { id: user.id, email: user.email, role: user.role, barberId: user.barberId, clientId: user.clientId, createdAt: user.createdAt },
    accessToken,
    refreshToken,
  }
}

export function refresh(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken)
  const accessToken = signAccessToken({ id: payload.id, role: payload.role })
  return { accessToken }
}
