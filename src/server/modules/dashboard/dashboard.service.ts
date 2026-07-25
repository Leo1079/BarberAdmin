import { prisma } from '../../config/database'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function monthStart() {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().split('T')[0]
}

function weekFrom() {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  return d.toISOString().split('T')[0]
}

export async function getOwnerDashboard() {
  const today = todayStr()
  const monthFrom = monthStart()
  const weekFromDate = weekFrom()

  // turnos de hoy
  const todayAppointments = await prisma.appointment.groupBy({
    by: ['status'],
    where: { date: today },
    _count: true,
  })
  const todayCounts = Object.fromEntries(todayAppointments.map(a => [a.status, a._count]))

  // ingresos / gastos del día
  const todayIncome = await prisma.cashMovement.aggregate({
    where: { date: today, type: 'income' },
    _sum: { amount: true },
  })
  const todayExpense = await prisma.cashMovement.aggregate({
    where: { date: today, type: 'expense' },
    _sum: { amount: true },
  })

  // ingresos del mes
  const monthIncome = await prisma.payment.aggregate({
    where: {
      createdAt: { gte: new Date(monthFrom) },
      status: 'PAID',
    },
    _sum: { amount: true },
  })

  // gastos del mes
  const monthExpense = await prisma.cashMovement.aggregate({
    where: { date: { gte: monthFrom }, type: 'expense' },
    _sum: { amount: true },
  })

  // barbero con más servicios completados en el mes
  const barberApptCounts = await prisma.appointment.groupBy({
    by: ['barberId'],
    where: { status: 'COMPLETED', date: { gte: monthFrom } },
    _count: true,
    orderBy: { _count: { barberId: 'desc' } },
    take: 1,
  })
  let topBarber = null
  if (barberApptCounts.length > 0) {
    topBarber = await prisma.barber.findUnique({
      where: { id: barberApptCounts[0].barberId },
      select: { id: true, name: true },
    })
  }

  // servicio más solicitado en el mes
  const serviceCounts = await prisma.appointment.groupBy({
    by: ['serviceId'],
    where: { date: { gte: monthFrom } },
    _count: true,
    orderBy: { _count: { serviceId: 'desc' } },
    take: 3,
  })
  const topServices = await Promise.all(
    serviceCounts.map(async s => {
      const svc = await prisma.service.findUnique({
        where: { id: s.serviceId },
        select: { id: true, name: true, price: true },
      })
      return { ...svc, count: s._count }
    }),
  )

  // clientes del mes
  const monthClients = await prisma.client.count({
    where: { createdAt: { gte: new Date(monthFrom) } },
  })

  // clientes recurrentes (>1 cita en total)
  const clientApptCounts = await prisma.appointment.groupBy({
    by: ['clientId'],
    _count: true,
    having: { clientId: { _count: { gt: 1 } } },
  })

  // semana: income/expense por día
  const weekMovements = await prisma.cashMovement.groupBy({
    by: ['date', 'type'],
    where: { date: { gte: weekFromDate } },
    _sum: { amount: true },
  })
  const weekMap: Record<string, { income: number; expense: number }> = {}
  for (const m of weekMovements) {
    if (!weekMap[m.date]) weekMap[m.date] = { income: 0, expense: 0 }
    if (m.type === 'income') weekMap[m.date].income = m._sum.amount ?? 0
    else weekMap[m.date].expense = m._sum.amount ?? 0
  }

  return {
    today: {
      appointments: todayCounts,
      totalAppointments: Object.values(todayCounts).reduce((a: number, b: number) => a + b, 0),
      income: todayIncome._sum.amount ?? 0,
      expense: todayExpense._sum.amount ?? 0,
      balance: (todayIncome._sum.amount ?? 0) - (todayExpense._sum.amount ?? 0),
    },
    month: {
      income: monthIncome._sum.amount ?? 0,
      expense: monthExpense._sum.amount ?? 0,
      balance: (monthIncome._sum.amount ?? 0) - (monthExpense._sum.amount ?? 0),
      topBarber,
      topServices,
      newClients: monthClients,
      recurringClients: clientApptCounts.length,
    },
    week: Array.from({ length: 7 }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const ds = d.toISOString().split('T')[0]
      return { date: ds, income: weekMap[ds]?.income ?? 0, expense: weekMap[ds]?.expense ?? 0 }
    }),
  }
}

export async function getBarberDashboard(barberId: string) {
  const today = todayStr()
  const monthFrom = monthStart()
  const weekFromDate = weekFrom()

  // turnos de hoy (los que aún no pasaron)
  const todayAppointments = await prisma.appointment.findMany({
    where: { barberId, date: today },
    include: { client: { select: { id: true, name: true, phone: true } }, service: { select: { id: true, name: true, durationMin: true } } },
    orderBy: { time: 'asc' },
  })

  // próximos turnos (futuros + CONFIRMED/PENDING)
  const upcoming = await prisma.appointment.findMany({
    where: { barberId, status: { in: ['PENDING', 'CONFIRMED'] }, date: { gte: today } },
    include: { client: { select: { id: true, name: true, phone: true } }, service: { select: { id: true, name: true } } },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
    take: 10,
  })

  // completados / cancelados (mes)
  const monthStatus = await prisma.appointment.groupBy({
    by: ['status'],
    where: { barberId, date: { gte: monthFrom } },
    _count: true,
  })
  const monthCounts = Object.fromEntries(monthStatus.map(s => [s.status, s._count]))

  // clientes atendidos en el mes
  const attendedClients = await prisma.appointment.groupBy({
    by: ['clientId'],
    where: { barberId, status: 'COMPLETED', date: { gte: monthFrom } },
    _count: true,
  })

  // ingresos generados en el mes
  const monthPayment = await prisma.payment.aggregate({
    where: {
      appointment: { barberId, date: { gte: monthFrom } },
      status: 'PAID',
    },
    _sum: { amount: true },
  })

  const barber = await prisma.barber.findUniqueOrThrow({
    where: { id: barberId },
    select: { commissionPct: true },
  })

  const generatedIncome = monthPayment._sum.amount ?? 0
  const commissionGenerated = Math.round(generatedIncome * barber.commissionPct / 100)

  // comisión pendiente (COMPLETED sin Payout)
  const pendingIncome = await prisma.payment.aggregate({
    where: {
      appointment: {
        barberId,
        status: 'COMPLETED',
        date: { gte: monthFrom },
        payouts: { none: {} },
      },
      status: 'PAID',
    },
    _sum: { amount: true },
  })
  const commissionPending = Math.round((pendingIncome._sum.amount ?? 0) * barber.commissionPct / 100)

  // semana: earned/advances por día
  const weekAppointments = await prisma.appointment.findMany({
    where: { barberId, status: 'COMPLETED', date: { gte: weekFromDate } },
    select: { date: true, service: { select: { price: true } }, payment: { select: { amount: true } } },
  })
  const weekAdvances = await prisma.adjustment.groupBy({
    by: ['date'],
    where: { barberId, type: 'advance', date: { gte: weekFromDate } },
    _sum: { amount: true },
  })
  const advanceMap: Record<string, number> = {}
  for (const a of weekAdvances) {
    advanceMap[a.date] = a._sum.amount ?? 0
  }
  const earnedMap: Record<string, number> = {}
  for (const a of weekAppointments) {
    const value = (a.payment?.amount ?? a.service.price) * barber.commissionPct / 100
    earnedMap[a.date] = Math.round((earnedMap[a.date] ?? 0) + value)
  }

  const week = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const ds = d.toISOString().split('T')[0]
    return { date: ds, earned: earnedMap[ds] ?? 0, advances: advanceMap[ds] ?? 0 }
  })
  const weekTotals = {
    earned: week.reduce((s, w) => s + w.earned, 0),
    advances: week.reduce((s, w) => s + w.advances, 0),
  }

  return {
    todayAppointments,
    upcoming,
    month: {
      completed: monthCounts['COMPLETED'] ?? 0,
      cancelled: monthCounts['CANCELLED'] ?? 0,
      noShow: monthCounts['NO_SHOW'] ?? 0,
      attendedClients: attendedClients.length,
      generatedIncome,
      commissionGenerated,
      commissionPending,
    },
    week,
    weekTotals,
  }
}

export async function getClientDashboard(clientId: string) {
  // próximo turno
  const today = todayStr()
  const nextAppointment = await prisma.appointment.findFirst({
    where: { clientId, date: { gte: today }, status: { in: ['PENDING', 'CONFIRMED', 'WAITING'] } },
    include: { barber: { select: { id: true, name: true } }, service: { select: { id: true, name: true, price: true, durationMin: true } } },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  })

  // historial (últimos 5)
  const history = await prisma.appointment.findMany({
    where: { clientId },
    include: { barber: { select: { id: true, name: true } }, service: { select: { id: true, name: true, price: true } } },
    orderBy: [{ date: 'desc' }, { time: 'desc' }],
    take: 5,
  })

  return { nextAppointment, history }
}

export async function getStats(dateFrom: string, dateTo: string) {
  // turnos por período
  const total = await prisma.appointment.count({
    where: { date: { gte: dateFrom, lte: dateTo } },
  })
  const statusCounts = await prisma.appointment.groupBy({
    by: ['status'],
    where: { date: { gte: dateFrom, lte: dateTo } },
    _count: true,
  })
  const byStatus = Object.fromEntries(statusCounts.map(s => [s.status, s._count]))

  // ingresos / gastos
  const income = await prisma.payment.aggregate({
    where: {
      createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo + 'T23:59:59Z') },
      status: 'PAID',
    },
    _sum: { amount: true },
  })
  const expense = await prisma.cashMovement.aggregate({
    where: { date: { gte: dateFrom, lte: dateTo }, type: 'expense' },
    _sum: { amount: true },
  })

  // comisiones generadas en el período
  const payouts = await prisma.payout.findMany({
    where: { date: { gte: dateFrom, lte: dateTo } },
    select: { commission: true },
  })
  const commissionsGenerated = payouts.reduce((s, p) => s + p.commission, 0)

  // comisiones pendientes en el período
  const completedPayments = await prisma.payment.aggregate({
    where: {
      appointment: {
        status: 'COMPLETED',
        date: { gte: dateFrom, lte: dateTo },
        payouts: { none: {} },
      },
      status: 'PAID',
    },
    _sum: { amount: true },
  })
  // estimado (usando comisión promedio de los barberos)
  const barbers = await prisma.barber.findMany({ select: { commissionPct: true } })
  const avgPct = barbers.length > 0 ? barbers.reduce((s, b) => s + b.commissionPct, 0) / barbers.length : 0
  const commissionsPending = Math.round((completedPayments._sum.amount ?? 0) * avgPct / 100)

  // clientes nuevos
  const newClients = await prisma.client.count({
    where: { createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo + 'T23:59:59Z') } },
  })

  // clientes recurrentes en el período
  const recurring = await prisma.appointment.groupBy({
    by: ['clientId'],
    where: { date: { gte: dateFrom, lte: dateTo } },
    _count: true,
    having: { clientId: { _count: { gt: 1 } } },
  })

  // servicio más vendido
  const topServiceData = await prisma.appointment.groupBy({
    by: ['serviceId'],
    where: { date: { gte: dateFrom, lte: dateTo } },
    _count: true,
    orderBy: { _count: { serviceId: 'desc' } },
    take: 1,
  })
  let topService = null
  if (topServiceData.length > 0) {
    const svc = await prisma.service.findUnique({
      where: { id: topServiceData[0].serviceId },
      select: { id: true, name: true, price: true },
    })
    topService = { ...svc, count: topServiceData[0]._count }
  }

  // barbero más activo
  const topBarberData = await prisma.appointment.groupBy({
    by: ['barberId'],
    where: { date: { gte: dateFrom, lte: dateTo } },
    _count: true,
    orderBy: { _count: { barberId: 'desc' } },
    take: 1,
  })
  let topBarber = null
  if (topBarberData.length > 0) {
    const b = await prisma.barber.findUnique({
      where: { id: topBarberData[0].barberId },
      select: { id: true, name: true },
    })
    topBarber = { ...b, count: topBarberData[0]._count }
  }

  return {
    period: { dateFrom, dateTo },
    appointments: {
      total,
      completed: byStatus['COMPLETED'] ?? 0,
      cancelled: byStatus['CANCELLED'] ?? 0,
      noShow: byStatus['NO_SHOW'] ?? 0,
      pending: (byStatus['PENDING'] ?? 0) + (byStatus['CONFIRMED'] ?? 0) + (byStatus['WAITING'] ?? 0),
      byStatus,
    },
    finances: {
      income: income._sum.amount ?? 0,
      expense: expense._sum.amount ?? 0,
      balance: (income._sum.amount ?? 0) - (expense._sum.amount ?? 0),
    },
    commissions: {
      generated: commissionsGenerated,
      pending: commissionsPending,
      paid: commissionsGenerated,
    },
    clients: {
      newClients,
      recurringClients: recurring.length,
    },
    topService,
    topBarber,
  }
}
