import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { validate } from '../../middleware/validate'
import { requireAuth } from '../../middleware/auth'
import { createCashMovementSchema } from './cash.validation'
import * as cashController from './cash.controller'

const router = Router()

router.use(requireAuth)

router.get('/', asyncHandler(cashController.list))
router.get('/balance', asyncHandler(cashController.getSummary))
router.post('/', validate(createCashMovementSchema), asyncHandler(cashController.create))
router.delete('/:id', asyncHandler(cashController.remove))

export default router
