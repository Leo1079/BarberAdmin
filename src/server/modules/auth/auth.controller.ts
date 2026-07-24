import type { Request, Response } from 'express'
import * as authService from './auth.service'

export async function register(req: Request, res: Response) {
  const { email, password, role } = req.body
  const user = await authService.register({ email, password, role })
  res.status(201).json(user)
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body
  const result = await authService.login(email, password)
  res.json(result)
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body
  const result = authService.refresh(refreshToken)
  res.json(result)
}

export async function logout(_req: Request, res: Response) {
  res.json({ message: 'Logged out' })
}
