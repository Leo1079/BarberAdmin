import { z } from 'zod'

export const createScheduleSchema = z.object({
  barberId: z.string().min(1),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
})

export const updateScheduleSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
})

export const createExceptionSchema = z.object({
  barberId: z.string().min(1),
  date: z.string().min(1),
  isDayOff: z.boolean().default(true),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
})

export const availabilityQuerySchema = z.object({
  barberId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().min(1),
})
