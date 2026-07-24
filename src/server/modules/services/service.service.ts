import { prisma } from '../../config/database'

export function list(activeOnly = false) {
  return prisma.service.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { name: 'asc' },
  })
}

export function getById(id: string) {
  return prisma.service.findUniqueOrThrow({ where: { id } })
}

export function create(data: { name: string; price: number; durationMin: number; description?: string }) {
  return prisma.service.create({ data })
}

export function update(id: string, data: Partial<{ name: string; price: number; durationMin: number; description: string }>) {
  return prisma.service.update({ where: { id }, data })
}

export function toggleActive(id: string) {
  return prisma.service.update({
    where: { id },
    data: { active: { set: false } },
  })
}
