import type { Request, Response } from 'express'
import * as serviceService from './service.service'

export async function list(req: Request, res: Response) {
  const activeOnly = req.query.active === 'true'
  const services = await serviceService.list(activeOnly)
  res.json(services)
}

export async function getById(req: Request, res: Response) {
  const service = await serviceService.getById(req.params.id as string)
  res.json(service)
}

export async function create(req: Request, res: Response) {
  const service = await serviceService.create(req.body)
  res.status(201).json(service)
}

export async function update(req: Request, res: Response) {
  const service = await serviceService.update(req.params.id as string, req.body)
  res.json(service)
}

export async function toggleActive(req: Request, res: Response) {
  const service = await serviceService.toggleActive(req.params.id as string)
  res.json(service)
}
