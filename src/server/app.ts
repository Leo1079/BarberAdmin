import express from 'express'
import cors from 'cors'
import compression from 'compression'
import { corsConfig } from './config/cors'
import { errorHandler } from './middleware/errorHandler'
import router from './routes'

const app = express()

app.use(cors(corsConfig))
app.use(express.json())
app.use(compression())

app.use('/api', router)

app.use(errorHandler)

export { app }
