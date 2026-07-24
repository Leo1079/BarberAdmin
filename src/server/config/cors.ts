import type { CorsOptions } from 'cors'
import { env } from './env'

const allowedOrigins = env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean)

export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}
