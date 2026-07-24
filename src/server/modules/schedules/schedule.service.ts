import { prisma } from '../../config/database'

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function getSchedules(barberId: string) {
  return prisma.schedule.findMany({ where: { barberId }, orderBy: { dayOfWeek: 'asc' } })
}

export function upsertSchedule(data: { barberId: string; dayOfWeek: number; startTime: string; endTime: string }) {
  return prisma.schedule.upsert({
    where: { barberId_dayOfWeek: { barberId: data.barberId, dayOfWeek: data.dayOfWeek } },
    update: { startTime: data.startTime, endTime: data.endTime },
    create: data,
  })
}

export function deleteSchedule(barberId: string, dayOfWeek: number) {
  return prisma.schedule.delete({ where: { barberId_dayOfWeek: { barberId, dayOfWeek } } })
}

export function getExceptions(barberId: string) {
  return prisma.scheduleException.findMany({ where: { barberId }, orderBy: { date: 'asc' } })
}

export function upsertException(data: { barberId: string; date: string; isDayOff: boolean; startTime?: string | null; endTime?: string | null }) {
  return prisma.scheduleException.upsert({
    where: { barberId_date: { barberId: data.barberId, date: data.date } },
    update: { isDayOff: data.isDayOff, startTime: data.startTime, endTime: data.endTime },
    create: data,
  })
}

export function deleteException(barberId: string, date: string) {
  return prisma.scheduleException.delete({ where: { barberId_date: { barberId, date } } })
}

export async function getAvailability(barberId: string, serviceId: string, date: string, tx?: typeof prisma) {
  const db = tx ?? prisma

  const service = await db.service.findUniqueOrThrow({ where: { id: serviceId } })
  const duration = service.durationMin

  const dayOfWeek = new Date(date + 'T12:00:00').getDay()

  const exception = await db.scheduleException.findUnique({
    where: { barberId_date: { barberId, date } },
  })

  if (exception?.isDayOff) return []

  let startTime: string
  let endTime: string

  if (exception && !exception.isDayOff && exception.startTime && exception.endTime) {
    startTime = exception.startTime
    endTime = exception.endTime
  } else {
    const schedule = await db.schedule.findUnique({
      where: { barberId_dayOfWeek: { barberId, dayOfWeek } },
    })
    if (!schedule) return []
    startTime = schedule.startTime
    endTime = schedule.endTime
  }

  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)

  const appointments = await db.appointment.findMany({
    where: { barberId, date, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
    include: { service: { select: { durationMin: true } } },
  })

  const busy = appointments.map((a) => ({
    start: timeToMinutes(a.time),
    end: timeToMinutes(a.time) + a.service.durationMin,
  }))

  const slots: string[] = []
  for (let t = start; t + duration <= end; t += 30) {
    const overlaps = busy.some((b) => t < b.end && t + duration > b.start)
    if (!overlaps) {
      const h = Math.floor(t / 60)
      const m = t % 60
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }

  return slots
}
