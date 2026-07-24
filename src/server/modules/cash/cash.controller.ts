import type { Request, Response } from 'express'
import * as cashService from './cash.service'

export async function list(req: Request, res: Response) {
  const movements = await cashService.list()
  res.json(movements)
}

export async function getSummary(req: Request, res: Response) {
  const summary = await cashService.getSummary()
  res.json(summary)
}

export async function create(req: Request, res: Response) {
  const movement = await cashService.create(req.body)
  res.status(201).json(movement)
}

export async function remove(req: Request, res: Response) {
  await cashService.remove(req.params.id)
  res.status(204).end()
}
