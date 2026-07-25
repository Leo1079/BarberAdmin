import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma/client'

const prisma = new PrismaClient()

async function main() {
  const counts: Record<string, number> = {}

  // 1
  const { count: c1 } = await prisma.cashMovement.deleteMany({})
  counts.cashMovement = c1

  // 2
  const { count: c2 } = await prisma.payoutAppointment.deleteMany({})
  counts.payoutAppointment = c2

  // 3
  const { count: c3 } = await prisma.payment.deleteMany({})
  counts.payment = c3

  // 4
  const { count: c4 } = await prisma.appointmentStatusHistory.deleteMany({})
  counts.appointmentStatusHistory = c4

  // 5
  const { count: c5 } = await prisma.appointment.deleteMany({})
  counts.appointment = c5

  // 6
  const { count: c6 } = await prisma.adjustment.deleteMany({})
  counts.adjustment = c6

  // 7
  const { count: c7 } = await prisma.advanceRequest.deleteMany({})
  counts.advanceRequest = c7

  // 8
  const { count: c8 } = await prisma.payout.deleteMany({})
  counts.payout = c8

  // 9
  const { count: c9 } = await prisma.appNotification.deleteMany({})
  counts.appNotification = c9

  // 10a
  const { count: c10a } = await prisma.user.deleteMany({ where: { clientId: { not: null } } })
  counts.user_client = c10a

  // 10b
  const { count: c10b } = await prisma.client.deleteMany({})
  counts.client = c10b

  // 11a — ids de barberos a borrar (excluyendo Pablo Arias, case-insensitive)
  const todos = await prisma.barber.findMany({ select: { id: true, name: true } })
  const idsABorrar = todos
    .filter((b) => b.name.toLowerCase() !== 'pablo arias')
    .map((b) => b.id)

  // 11b
  const { count: c11b } = await prisma.user.deleteMany({ where: { barberId: { in: idsABorrar } } })
  counts.user_barber = c11b

  // 11c
  const { count: c11c } = await prisma.schedule.deleteMany({ where: { barberId: { in: idsABorrar } } })
  counts.schedule = c11c

  // 11d
  const { count: c11d } = await prisma.scheduleException.deleteMany({ where: { barberId: { in: idsABorrar } } })
  counts.scheduleException = c11d

  // 11e
  const { count: c11e } = await prisma.barber.deleteMany({ where: { id: { in: idsABorrar } } })
  counts.barber = c11e

  const pablo = await prisma.barber.findFirst({ where: { name: { equals: 'Pablo Arias', mode: 'insensitive' } } })
  const pabloOk = pablo ? 'SÍ' : 'NO'

  console.log('=== Reset completado ===')
  for (const [table, n] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(24)} ${n}`)
  }
  console.log('')
  console.log(`Pablo Arias existe: ${pabloOk}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
