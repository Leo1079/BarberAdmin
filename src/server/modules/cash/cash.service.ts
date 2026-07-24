import { prisma } from '../../config/database'

export function list(barberId?: string) {
  const where: any = {}
  if (barberId) where.barberId = barberId
  return prisma.cashMovement.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}

export function balance() {
  return prisma.cashMovement.aggregate({
    _sum: { amount: true },
    where: {},
  }).then((r) => r._sum.amount ?? 0)
}

export async function getSummary() {
  const [income, expense, movements] = await Promise.all([
    prisma.cashMovement.aggregate({
      _sum: { amount: true },
      where: { type: 'income' },
    }),
    prisma.cashMovement.aggregate({
      _sum: { amount: true },
      where: { type: 'expense' },
    }),
    prisma.cashMovement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])
  return {
    totalIncome: income._sum.amount ?? 0,
    totalExpense: expense._sum.amount ?? 0,
    movements,
  }
}

export function create(data: { type: string; amount: number; description: string; category: string; date: string }) {
  return prisma.cashMovement.create({ data })
}

export function remove(id: string) {
  return prisma.cashMovement.delete({ where: { id } })
}
