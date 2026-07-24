import { prisma } from '../../config/database'
import { getAvailability } from '../schedules/schedule.service'
import { canTransition, type AppointmentStatus } from './appointment.utils'

export function list(filters: { barberId?: string; clientId?: string; date?: string; status?: string }) {
  const where: any = {}
  if (filters.barberId) where.barberId = filters.barberId
  if (filters.clientId) where.clientId = filters.clientId
  if (filters.date) where.date = filters.date
  if (filters.status) where.status = filters.status

  return prisma.appointment.findMany({
    where,
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
    include: {
      barber: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
      service: { select: { id: true, name: true, price: true, durationMin: true } },
      payment: true,
    },
  })
}

export function getById(id: string) {
  return prisma.appointment.findUniqueOrThrow({
    where: { id },
    include: {
      barber: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
      service: { select: { id: true, name: true, price: true, durationMin: true } },
      payment: true,
      statusHistory: { orderBy: { createdAt: 'desc' } },
    },
  })
}

export async function create(data: { clientId: string; barberId: string; serviceId: string; date: string; time: string; skipAvailability?: boolean }) {
  return prisma.$transaction(async (tx) => {
    if (!data.skipAvailability) {
      const slots = await getAvailability(data.barberId, data.serviceId, data.date, tx as any)
      if (!slots.includes(data.time)) {
        throw Object.assign(new Error('Time slot is no longer available'), { statusCode: 409 })
      }
    }
    return tx.appointment.create({
      data: {
        clientId: data.clientId,
        barberId: data.barberId,
        serviceId: data.serviceId,
        date: data.date,
        time: data.time,
        status: 'PENDING',
      },
      include: {
        barber: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, price: true, durationMin: true } },
      },
    })
  })
}

export async function walkInComplete(data: {
  clientId: string
  barberId: string
  serviceId: string
  date: string
  time: string
  paymentMethod: string
}) {
  return prisma.$transaction(async (tx) => {
    const service = await tx.service.findUniqueOrThrow({ where: { id: data.serviceId } })
    const barber = await tx.barber.findUniqueOrThrow({ where: { id: data.barberId } })

    const appointment = await tx.appointment.create({
      data: {
        clientId: data.clientId,
        barberId: data.barberId,
        serviceId: data.serviceId,
        date: data.date,
        time: data.time,
        status: 'COMPLETED',
      },
    })

    await tx.appointmentStatusHistory.create({
      data: {
        appointmentId: appointment.id,
        fromStatus: 'PENDING',
        toStatus: 'COMPLETED',
      },
    })

    await tx.payment.create({
      data: {
        appointmentId: appointment.id,
        amount: service.price,
        method: data.paymentMethod as any,
        status: 'PAID',
      },
    })

    await tx.cashMovement.create({
      data: {
        type: 'income',
        amount: service.price,
        description: `${service.name} - ${(await tx.client.findUnique({ where: { id: data.clientId }, select: { name: true } }))?.name ?? 'Walk-in'}`,
        category: 'Servicio',
        date: data.date,
        appointmentId: appointment.id,
        barberId: data.barberId,
      },
    })

    return tx.appointment.findUniqueOrThrow({
      where: { id: appointment.id },
      include: {
        barber: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, price: true, durationMin: true } },
        payment: true,
      },
    })
  })
}

export async function updateStatus(id: string, newStatus: AppointmentStatus, userId: string, role: string) {
  return prisma.$transaction(async (tx) => {
    const appt = await tx.appointment.findUniqueOrThrow({ where: { id } })
    if (!canTransition(appt.status as AppointmentStatus, newStatus, role)) {
      throw Object.assign(new Error('Invalid status transition'), { statusCode: 400 })
    }
    const updated = await tx.appointment.update({
      where: { id },
      data: { status: newStatus },
    })
    await tx.appointmentStatusHistory.create({
      data: {
        appointmentId: id,
        fromStatus: appt.status as AppointmentStatus,
        toStatus: newStatus,
        changedByUserId: userId,
      },
    })
    return updated
  })
}
