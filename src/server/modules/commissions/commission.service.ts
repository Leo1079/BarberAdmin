import { prisma } from '../../config/database'

// ── Adjustments ──

export function listAdjustments(barberId?: string) {
  const where: any = {}
  if (barberId) where.barberId = barberId
  return prisma.adjustment.findMany({ where, orderBy: { date: 'desc' }, include: { barber: { select: { name: true } } } })
}

export function createAdjustment(data: { barberId: string; type: string; amount: number; description: string; date: string }) {
  return prisma.adjustment.create({ data: data as any })
}

// ── Advance Requests ──

export function listAdvanceRequests(barberId?: string, status?: string) {
  const where: any = {}
  if (barberId) where.barberId = barberId
  if (status) where.status = status
  return prisma.advanceRequest.findMany({ where, orderBy: { createdAt: 'desc' }, include: { barber: { select: { name: true } } } })
}

export function createAdvanceRequest(data: { barberId: string; amount: number; description: string; date: string }) {
  return prisma.advanceRequest.create({ data: { ...data, status: 'pending' } })
}

export async function updateAdvanceStatus(id: string, status: string) {
  return prisma.$transaction(async (tx) => {
    const req = await tx.advanceRequest.findUniqueOrThrow({ where: { id } })
    if (req.status !== 'pending') throw Object.assign(new Error('Request already processed'), { statusCode: 400 })

    const updated = await tx.advanceRequest.update({ where: { id }, data: { status } })

    if (status === 'approved') {
      await tx.adjustment.create({
        data: {
          barberId: req.barberId,
          type: 'advance',
          amount: req.amount,
          description: req.description,
          date: req.date,
        },
      })
    }

    return updated
  })
}

// ── Payouts ──

export function listPayouts(barberId?: string) {
  const where: any = {}
  if (barberId) where.barberId = barberId
  return prisma.payout.findMany({
    where,
    orderBy: { date: 'desc' },
    include: {
      barber: { select: { id: true, name: true, commissionPct: true } },
      appointments: { include: { appointment: { include: { service: { select: { name: true, price: true } } } } } },
    },
  })
}

export async function getPendingSummary() {
  const barbers = await prisma.barber.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, commissionPct: true },
  })

  const result = await Promise.all(
    barbers.map(async (barber) => {
      const appointments = await prisma.appointment.findMany({
        where: {
          barberId: barber.id,
          status: 'COMPLETED',
          payouts: { none: {} },
        },
        include: {
          payment: { select: { amount: true } },
          service: { select: { name: true, price: true } },
        },
      })

      const totalGenerated = appointments.reduce((s, a) => s + (a.payment?.amount ?? a.service.price), 0)
      const commission = Math.round(totalGenerated * barber.commissionPct / 100)

      const adjustments = await prisma.adjustment.findMany({
        where: { barberId: barber.id },
      })
      const advances = adjustments.filter(a => a.type === 'advance').reduce((s, a) => s + a.amount, 0)
      const discounts = adjustments.filter(a => a.type === 'discount').reduce((s, a) => s + a.amount, 0)
      const total = commission - advances - discounts

      return {
        barberId: barber.id,
        barberName: barber.name,
        commissionPct: barber.commissionPct,
        totalGenerated,
        commission,
        advances,
        discounts,
        total,
        pendingAppointments: appointments.length,
      }
    }),
  )

  return result
}

export async function calculatePayout(data: { barberId: string; dateFrom: string; dateTo: string }) {
  return prisma.$transaction(async (tx) => {
    const barber = await tx.barber.findUniqueOrThrow({ where: { id: data.barberId } })

    const dateFilter = data.dateFrom && data.dateTo
      ? { gte: data.dateFrom, lte: data.dateTo }
      : undefined

    const appointments = await tx.appointment.findMany({
      where: {
        barberId: data.barberId,
        status: 'COMPLETED',
        ...(dateFilter ? { date: dateFilter } : {}),
        payouts: { none: {} },
      },
      include: {
        payment: { select: { amount: true } },
        service: { select: { name: true, price: true } },
      },
    })

    if (appointments.length === 0) {
      throw Object.assign(new Error('No hay turnos pendientes de liquidar para este barbero'), { statusCode: 400 })
    }

    const adjustments = await tx.adjustment.findMany({
      where: {
        barberId: data.barberId,
        date: { gte: data.dateFrom, lte: data.dateTo },
      },
    })

    const totalGenerated = appointments.reduce((s, a) => s + (a.payment?.amount ?? a.service.price), 0)
    const commissionPct = barber.commissionPct
    const commission = Math.round(totalGenerated * commissionPct / 100)
    const advances = adjustments.filter(a => a.type === 'advance').reduce((s, a) => s + a.amount, 0)
    const discounts = adjustments.filter(a => a.type === 'discount').reduce((s, a) => s + a.amount, 0)
    const total = commission - advances - discounts

    const payout = await tx.payout.create({
      data: {
        barberId: data.barberId,
        date: data.dateTo,
        totalGenerated,
        commissionPct,
        commission,
        advances,
        discounts,
        total,
      },
    })

    for (const appt of appointments) {
      await tx.payoutAppointment.create({
        data: { payoutId: payout.id, appointmentId: appt.id },
      })
    }

    await tx.cashMovement.create({
      data: {
        type: 'expense',
        amount: total,
        description: `Liquidación a ${barber.name} - ${appointments.length} turno${appointments.length !== 1 ? 's' : ''}`,
        category: 'Liquidación',
        date: data.dateTo,
        barberId: data.barberId,
      },
    })

    return {
      ...payout,
      appointments: appointments.map(a => ({ id: a.id, time: a.time, service: a.service.name, amount: a.payment?.amount ?? a.service.price })),
      adjustments: adjustments.map(a => ({ id: a.id, type: a.type, amount: a.amount, description: a.description })),
    }
  })
}
