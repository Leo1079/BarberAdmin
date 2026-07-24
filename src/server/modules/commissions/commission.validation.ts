import { z } from 'zod'

export const createAdjustmentSchema = z.object({
  barberId: z.string().min(1),
  type: z.enum(['advance', 'discount']),
  amount: z.number().int().positive(),
  description: z.string().min(1),
  date: z.string().min(1),
})

export const createAdvanceRequestSchema = z.object({
  barberId: z.string().min(1),
  amount: z.number().int().positive(),
  description: z.string().min(1),
  date: z.string().min(1),
})

export const updateAdvanceStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
})

export const createPayoutSchema = z.object({
  barberId: z.string().min(1),
  dateFrom: z.string().min(1),
  dateTo: z.string().min(1),
})
