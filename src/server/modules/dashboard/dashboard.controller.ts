import type { Request, Response } from 'express'
import * as dashboardService from './dashboard.service'
import { prisma } from '../../config/database'

export async function getOwnerDashboard(_req: Request, res: Response) {
  const data = await dashboardService.getOwnerDashboard()
  res.json(data)
}

export async function getBarberDashboard(req: Request, res: Response) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.user!.id },
    select: { barberId: true },
  })
  const data = await dashboardService.getBarberDashboard(user.barberId!)
  res.json(data)
}

export async function getClientDashboard(req: Request, res: Response) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.user!.id },
    select: { clientId: true },
  })
  const data = await dashboardService.getClientDashboard(user.clientId!)
  res.json(data)
}

export async function getStats(req: Request, res: Response) {
  const { dateFrom, dateTo } = req.query as { dateFrom: string; dateTo: string }
  if (!dateFrom || !dateTo) {
    res.status(400).json({ error: 'dateFrom and dateTo are required' })
    return
  }
  const data = await dashboardService.getStats(dateFrom, dateTo)
  res.json(data)
}
