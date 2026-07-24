import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { validate } from '../../middleware/validate'
import { requireAuth } from '../../middleware/auth'
import { requireRole } from '../../middleware/authorize'
import { createServiceSchema, updateServiceSchema } from './service.validation'
import * as serviceController from './service.controller'

const router = Router()

router.use(requireAuth)

router.get('/', asyncHandler(serviceController.list))
router.get('/:id', asyncHandler(serviceController.getById))
router.post('/', requireRole('OWNER'), validate(createServiceSchema), asyncHandler(serviceController.create))
router.patch('/:id', requireRole('OWNER'), validate(updateServiceSchema), asyncHandler(serviceController.update))
router.patch('/:id/toggle-active', requireRole('OWNER'), asyncHandler(serviceController.toggleActive))

export default router
