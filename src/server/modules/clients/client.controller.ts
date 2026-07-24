import type { Request, Response } from 'express'
import * as clientService from './client.service'
import { prisma } from '../../config/database'

export async function list(req: Request, res: Response) {
  const activeOnly = req.query.active === 'true'
  const clients = await clientService.list(activeOnly)
  res.json(clients)
}

export async function getById(req: Request, res: Response) {
  const client = await clientService.getById(req.params.id as string)
  res.json(client)
}

export async function create(req: Request, res: Response) {
  const client = await clientService.create(req.body)
  res.status(201).json(client)
}

export async function update(req: Request, res: Response) {
  const client = await clientService.update(req.params.id as string, req.body)
  res.json(client)
}

export async function toggleActive(req: Request, res: Response) {
  const client = await clientService.toggleActive(req.params.id as string)
  res.json(client)
}
