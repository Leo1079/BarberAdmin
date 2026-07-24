import { prisma } from '../../config/database'

export async function create(data: { appointmentId: string; amount: number; method: string }) {
  return prisma.payment.create({
    data: {
      appointmentId: data.appointmentId,
      amount: data.amount,
      method: data.method as any,
      status: 'PAID',
    },
    include: { appointment: { select: { id: true } } },
  })
}
