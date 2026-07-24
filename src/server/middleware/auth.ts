import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, type TokenPayload } from '../modules/auth/auth.utils'

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' })
    return
  }

  const token = header.slice(7)
  try {
    req.user = verifyAccessToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
