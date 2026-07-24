import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { validate } from '../../middleware/validate'
import { requireAuth } from '../../middleware/auth'
import { requireRole } from '../../middleware/authorize'
import { createBarberSchema, updateBarberSchema, resetPasswordSchema } from './barber.validation'
import * as barberController from './barber.controller'

const router = Router()

router.use(requireAuth)

router.get('/', asyncHandler(barberController.list))
router.get('/:id', asyncHandler(barberController.getById))
router.post('/', requireRole('OWNER'), validate(createBarberSchema), asyncHandler(barberController.create))
router.patch('/:id', requireRole('OWNER'), validate(updateBarberSchema), asyncHandler(barberController.update))
router.patch('/:id/reset-password', requireRole('OWNER'), validate(resetPasswordSchema), asyncHandler(barberController.resetPassword))
router.patch('/:id/toggle-active', requireRole('OWNER'), asyncHandler(barberController.toggleActive))

export default router
