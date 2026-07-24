import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['OWNER', 'BARBER', 'CLIENT']).default('CLIENT'),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})
