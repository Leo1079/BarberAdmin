import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { validate } from '../../middleware/validate'
import { requireAuth } from '../../middleware/auth'
import { createPaymentSchema } from './payment.validation'
import * as paymentController from './payment.controller'

const router = Router()

router.use(requireAuth)

router.post('/', validate(createPaymentSchema), asyncHandler(paymentController.create))

export default router
