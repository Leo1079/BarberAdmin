import { Router } from 'express'
import authRoutes from '../modules/auth/auth.routes'
import serviceRoutes from '../modules/services/service.routes'
import barberRoutes from '../modules/barbers/barber.routes'
import clientRoutes from '../modules/clients/client.routes'
import scheduleRoutes from '../modules/schedules/schedule.routes'
import appointmentRoutes from '../modules/appointments/appointment.routes'
import paymentRoutes from '../modules/payments/payment.routes'
import cashRoutes from '../modules/cash/cash.routes'
import commissionRoutes from '../modules/commissions/commission.routes'
import dashboardRoutes from '../modules/dashboard/dashboard.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/services', serviceRoutes)
router.use('/barbers', barberRoutes)
router.use('/clients', clientRoutes)
router.use('/schedules', scheduleRoutes)
router.use('/appointments', appointmentRoutes)
router.use('/payments', paymentRoutes)
router.use('/cash', cashRoutes)
router.use('/commissions', commissionRoutes)
router.use('/dashboard', dashboardRoutes)

export default router
