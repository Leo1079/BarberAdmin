import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireAuth } from '../../middleware/auth'
import { requireRole } from '../../middleware/authorize'
import * as scheduleController from './schedule.controller'

const router = Router()

router.use(requireAuth)

router.get('/availability', asyncHandler(scheduleController.getAvailability))
router.get('/:barberId', asyncHandler(scheduleController.getSchedules))
router.post('/', requireRole('OWNER'), asyncHandler(scheduleController.upsertSchedule))
router.delete('/:barberId/:dayOfWeek', requireRole('OWNER'), asyncHandler(scheduleController.deleteSchedule))
router.get('/:barberId/exceptions', asyncHandler(scheduleController.getExceptions))
router.post('/exceptions', requireRole('OWNER'), asyncHandler(scheduleController.upsertException))
router.delete('/exceptions/:barberId/:date', requireRole('OWNER'), asyncHandler(scheduleController.deleteException))

export default router
