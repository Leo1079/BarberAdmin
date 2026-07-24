import { z } from 'zod'

export const createBarberSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().default(''),
  address: z.string().default(''),
  photo: z.string().default(''),
  commissionPct: z.number().min(0).max(100),
  workStart: z.string().regex(/^\d{2}:\d{2}$/),
  workEnd: z.string().regex(/^\d{2}:\d{2}$/),
})

export const updateBarberSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  photo: z.string().optional(),
  commissionPct: z.number().min(0).max(100).optional(),
  workStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  workEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
})

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8),
})
