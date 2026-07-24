import { z } from 'zod'

export const createPaymentSchema = z.object({
  appointmentId: z.string().min(1),
  amount: z.number().int().positive(),
  method: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'MERCADO_PAGO', 'TARJETA']),
})
