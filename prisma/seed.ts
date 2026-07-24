import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const BCRYPT_ROUNDS = 10

async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, BCRYPT_ROUNDS)
}

async function main() {
  const hash = await hashPassword('Admin123!')

  const existing = await prisma.user.findUnique({ where: { email: 'admin@barber.com' } })
  if (!existing) {
    await prisma.user.create({
      data: { email: 'admin@barber.com', password: hash, role: 'OWNER' },
    })
  }

  const settingsCount = await prisma.settings.count()
  if (settingsCount === 0) {
    await prisma.settings.create({
      data: {
        shopName: 'Tucson Barber',
        address: '',
        phone: '',
        openDays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
        openHour: '09:00',
        closeHour: '20:00',
        slotMinutes: 30,
      },
    })
  }

  console.log('Seed OK — solo OWNER user + settings')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
