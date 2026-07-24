import { z } from 'zod'

export const createAppointmentSchema = z.object({
  clientId: z.string().min(1),
  barberId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().min(1),
  time: z.string().regex(/^\d{2}:\d{2}$/),
})

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
})

export const appointmentQuerySchema = z.object({
  barberId: z.string().optional(),
  clientId: z.string().optional(),
  date: z.string().optional(),
  status: z.string().optional(),
})
