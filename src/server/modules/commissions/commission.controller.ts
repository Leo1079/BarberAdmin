import type { Request, Response } from 'express'
import * as commissionService from './commission.service'
import { prisma } from '../../config/database'

export async function listAdjustments(req: Request, res: Response) {
  let barberId: string | undefined
  if (req.user!.role === 'BARBER') {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { barberId: true } })
    barberId = user?.barberId ?? undefined
  } else if (typeof req.query.barberId === 'string') {
    barberId = req.query.barberId
  }
  const adjustments = await commissionService.listAdjustments(barberId)
  res.json(adjustments)
}

export async function createAdjustment(req: Request, res: Response) {
  const adjustment = await commissionService.createAdjustment(req.body)
  res.status(201).json(adjustment)
}

export async function listAdvanceRequests(req: Request, res: Response) {
  let barberId: string | undefined
  if (req.user!.role === 'BARBER') {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { barberId: true } })
    barberId = user?.barberId ?? undefined
  } else if (typeof req.query.barberId === 'string') {
    barberId = req.query.barberId
  }
  const status = typeof req.query.status === 'string' ? req.query.status : undefined
  const requests = await commissionService.listAdvanceRequests(barberId, status)
  res.json(requests)
}

export async function createAdvanceRequest(req: Request, res: Response) {
  const request = await commissionService.createAdvanceRequest(req.body)
  res.status(201).json(request)
}

export async function updateAdvanceStatus(req: Request, res: Response) {
  const request = await commissionService.updateAdvanceStatus(req.params.id, req.body.status)
  res.json(request)
}

export async function getPendingSummary(_req: Request, res: Response) {
  const summary = await commissionService.getPendingSummary()
  res.json(summary)
}

export async function listPayouts(req: Request, res: Response) {
  let barberId: string | undefined
  if (req.user!.role === 'BARBER') {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { barberId: true } })
    barberId = user?.barberId ?? undefined
  } else if (typeof req.query.barberId === 'string') {
    barberId = req.query.barberId
  }
  const payouts = await commissionService.listPayouts(barberId)
  res.json(payouts)
}

export async function calculatePayout(req: Request, res: Response) {
  const payout = await commissionService.calculatePayout(req.body)
  res.status(201).json(payout)
}
