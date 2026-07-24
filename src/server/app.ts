import express from 'express'
import cors from 'cors'
import { corsConfig } from './config/cors'
import { errorHandler } from './middleware/errorHandler'
import router from './routes'

const app = express()

app.use(cors(corsConfig))
app.use(express.json())

app.use('/api', router)

app.use(errorHandler)

export { app }
