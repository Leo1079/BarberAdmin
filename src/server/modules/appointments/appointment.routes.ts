import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { validate } from '../../middleware/validate'
import { requireAuth } from '../../middleware/auth'
import { requireRole } from '../../middleware/authorize'
import { createAppointmentSchema, updateStatusSchema } from './appointment.validation'
import * as appointmentController from './appointment.controller'
import * as scheduleController from '../schedules/schedule.controller'

const router = Router()

router.use(requireAuth)

router.get('/', asyncHandler(appointmentController.list))
router.get('/availability', asyncHandler(scheduleController.getAvailability))
router.get('/:id', asyncHandler(appointmentController.getById))
router.post('/', validate(createAppointmentSchema), asyncHandler(appointmentController.create))
router.post('/walk-in', validate(createAppointmentSchema), asyncHandler(appointmentController.walkInCreate))
router.patch('/:id/status', validate(updateStatusSchema), asyncHandler(appointmentController.updateStatus))

export default router
