import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireAuth } from '../../middleware/auth'
import { requireRole } from '../../middleware/authorize'
import * as dashboardController from './dashboard.controller'

const router = Router()

router.use(requireAuth)

router.get('/owner', requireRole('OWNER'), asyncHandler(dashboardController.getOwnerDashboard))
router.get('/barber', requireRole('BARBER'), asyncHandler(dashboardController.getBarberDashboard))
router.get('/client', requireRole('CLIENT'), asyncHandler(dashboardController.getClientDashboard))
router.get('/stats', requireRole('OWNER'), asyncHandler(dashboardController.getStats))

export default router
