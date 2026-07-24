import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { validate } from '../../middleware/validate'
import { requireAuth } from '../../middleware/auth'
import { requireRole } from '../../middleware/authorize'
import { createAdjustmentSchema, createAdvanceRequestSchema, updateAdvanceStatusSchema, createPayoutSchema } from './commission.validation'
import * as commissionController from './commission.controller'

const router = Router()

router.use(requireAuth)

// Adjustments: OWNER CRUD, BARBER list own
router.get('/adjustments', asyncHandler(commissionController.listAdjustments))
router.post('/adjustments', requireRole('OWNER'), validate(createAdjustmentSchema), asyncHandler(commissionController.createAdjustment))

// Advance requests: BARBER creates own, OWNER approves/rejects
router.get('/advance-requests', asyncHandler(commissionController.listAdvanceRequests))
router.post('/advance-requests', validate(createAdvanceRequestSchema), asyncHandler(commissionController.createAdvanceRequest))
router.patch('/advance-requests/:id/status', requireRole('OWNER'), validate(updateAdvanceStatusSchema), asyncHandler(commissionController.updateAdvanceStatus))

// Payouts: OWNER calculates and lists all, BARBER lists own
router.get('/payouts', asyncHandler(commissionController.listPayouts))
router.get('/pending-summary', requireRole('OWNER'), asyncHandler(commissionController.getPendingSummary))
router.post('/payouts', requireRole('OWNER'), validate(createPayoutSchema), asyncHandler(commissionController.calculatePayout))

export default router
