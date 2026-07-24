import type { Request, Response } from 'express'
import * as paymentService from './payment.service'

export async function create(req: Request, res: Response) {
  const payment = await paymentService.create(req.body)
  res.status(201).json(payment)
}
