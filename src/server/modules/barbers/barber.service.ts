import bcrypt from 'bcrypt'
import { prisma } from '../../config/database'

const BCRYPT_ROUNDS = 10

export function list(activeOnly = false) {
  return prisma.barber.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { name: 'asc' },
    include: { user: { select: { id: true, email: true } } },
  })
}

export function getById(id: string) {
  return prisma.barber.findUniqueOrThrow({
    where: { id },
    include: { user: { select: { id: true, email: true } } },
  })
}

export async function create(data: {
  name: string
  email: string
  password: string
  phone?: string
  address?: string
  photo?: string
  commissionPct: number
  workStart: string
  workEnd: string
}) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email: data.email } })
    if (existing) throw Object.assign(new Error('Email already in use'), { statusCode: 409 })

    const hashed = await bcrypt.hash(data.password, BCRYPT_ROUNDS)

    const barber = await tx.barber.create({
      data: {
        name: data.name,
        phone: data.phone ?? '',
        address: data.address ?? '',
        photo: data.photo ?? '',
        commissionPct: data.commissionPct,
        workStart: data.workStart,
        workEnd: data.workEnd,
      },
    })

    await tx.user.create({
      data: {
        email: data.email,
        password: hashed,
        role: 'BARBER',
        barberId: barber.id,
      },
    })

    return tx.barber.findUniqueOrThrow({
      where: { id: barber.id },
      include: { user: { select: { id: true, email: true } } },
    })
  })
}

export async function update(id: string, data: Partial<{
  name: string
  email: string
  phone: string
  address: string
  photo: string
  commissionPct: number
  workStart: string
  workEnd: string
}>) {
  return prisma.$transaction(async (tx) => {
    if (data.email) {
      const conflict = await tx.user.findFirst({
        where: { email: data.email, barberId: { not: id } },
      })
      if (conflict) throw Object.assign(new Error('Email already in use'), { statusCode: 409 })

      await tx.user.update({
        where: { barberId: id },
        data: { email: data.email },
      })
    }

    const { email, ...barberData } = data
    return tx.barber.update({
      where: { id },
      data: barberData,
      include: { user: { select: { id: true, email: true } } },
    })
  })
}

export async function resetPassword(id: string, newPassword: string) {
  const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
  return prisma.user.update({
    where: { barberId: id },
    data: { password: hashed },
  })
}

export function toggleActive(id: string) {
  return prisma.barber.update({
    where: { id },
    data: { active: { set: false } },
  })
}
