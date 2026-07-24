import { prisma } from '../../config/database'

export function list(activeOnly = false) {
  return prisma.client.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { name: 'asc' },
    include: { user: { select: { id: true, email: true } } },
  })
}

export function getById(id: string) {
  return prisma.client.findUniqueOrThrow({ where: { id } })
}

export function create(data: { name: string; phone?: string; email?: string }) {
  return prisma.client.create({ data })
}

export function update(id: string, data: Partial<{ name: string; phone: string; email: string }>) {
  return prisma.client.update({ where: { id }, data })
}

export function toggleActive(id: string) {
  return prisma.client.update({
    where: { id },
    data: { active: { set: false } },
  })
}
