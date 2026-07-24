import { z } from 'zod'

export const createServiceSchema = z.object({
  name: z.string().min(1),
  price: z.number().int().positive(),
  durationMin: z.number().int().positive(),
  description: z.string().default(''),
})

export const updateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().int().positive().optional(),
  durationMin: z.number().int().positive().optional(),
  description: z.string().optional(),
})
