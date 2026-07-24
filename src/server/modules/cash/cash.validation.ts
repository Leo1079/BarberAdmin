import { z } from 'zod'

export const createCashMovementSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().int().positive(),
  description: z.string().min(1),
  category: z.string().min(1),
  date: z.string().min(1),
})
