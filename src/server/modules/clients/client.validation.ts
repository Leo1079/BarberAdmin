import { z } from 'zod'

export const createClientSchema = z.object({
  name: z.string().min(1),
  phone: z.string().default(''),
  email: z.string().default(''),
})

export const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
})
