import type { Request, Response } from 'express'
import * as barberService from './barber.service'

export async function list(req: Request, res: Response) {
  const activeOnly = req.query.active === 'true'
  const barbers = await barberService.list(activeOnly)
  res.json(barbers)
}

export async function getById(req: Request, res: Response) {
  const barber = await barberService.getById(req.params.id as string)
  res.json(barber)
}

export async function create(req: Request, res: Response) {
  const barber = await barberService.create(req.body)
  res.status(201).json(barber)
}

export async function update(req: Request, res: Response) {
  const barber = await barberService.update(req.params.id as string, req.body)
  res.json(barber)
}

export async function toggleActive(req: Request, res: Response) {
  const barber = await barberService.toggleActive(req.params.id as string)
  res.json(barber)
}

export async function resetPassword(req: Request, res: Response) {
  await barberService.resetPassword(req.params.id as string, req.body.newPassword)
  res.json({ ok: true })
}
