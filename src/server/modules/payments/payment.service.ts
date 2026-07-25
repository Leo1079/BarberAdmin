import { prisma } from '../../config/database'

export async function create(data: { appointmentId: string; amount: number; method: string }) {
  return prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUniqueOrThrow({
      where: { id: data.appointmentId },
      include: { service: true, client: true },
    })

    const payment = await tx.payment.create({
      data: {
        appointmentId: data.appointmentId,
        amount: data.amount,
        method: data.method as any,
        status: 'PAID',
      },
    })

    await tx.cashMovement.create({
      data: {
        type: 'income',
        amount: data.amount,
        description: `${appointment.service.name} - ${appointment.client.name}`,
        category: 'Servicio',
        date: appointment.date,
        appointmentId: data.appointmentId,
        barberId: appointment.barberId,
      },
    })

    return payment
  })
}
