import type { Request, Response } from 'express'
import * as appointmentService from './appointment.service'
import { prisma } from '../../config/database'

export async function list(req: Request, res: Response) {
  const { role, id: userId } = req.user!
  const filters: any = {}

  if (role === 'CLIENT') {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { clientId: true } })
    if (user?.clientId) filters.clientId = user.clientId
    else { res.json([]); return }
  } else if (role === 'BARBER') {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { barberId: true } })
    if (user?.barberId) filters.barberId = user.barberId
    else { res.json([]); return }
  } else {
    if (req.query.barberId) filters.barberId = req.query.barberId as string
    if (req.query.clientId) filters.clientId = req.query.clientId as string
  }
  if (req.query.date) filters.date = req.query.date as string
  if (req.query.status) filters.status = req.query.status as string

  const appointments = await appointmentService.list(filters)
  res.json(appointments)
}

export async function getById(req: Request, res: Response) {
  const appointment = await appointmentService.getById(req.params.id)
  res.json(appointment)
}

export async function create(req: Request, res: Response) {
  const appointment = await appointmentService.create({
    ...req.body,
    skipAvailability: req.user!.role === 'BARBER',
  })
  res.status(201).json(appointment)
}

export async function walkInCreate(req: Request, res: Response) {
  const appointment = await appointmentService.walkInComplete({
    clientId: req.body.clientId,
    barberId: req.body.barberId,
    serviceId: req.body.serviceId,
    date: req.body.date,
    time: req.body.time,
    paymentMethod: req.body.paymentMethod ?? 'EFECTIVO',
  })
  res.status(201).json(appointment)
}

export async function updateStatus(req: Request, res: Response) {
  const appointment = await appointmentService.updateStatus(req.params.id, req.body.status, req.user!.id, req.user!.role)
  res.json(appointment)
}
