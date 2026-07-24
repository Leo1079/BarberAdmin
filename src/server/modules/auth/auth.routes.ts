import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { validate } from '../../middleware/validate'
import { registerSchema, loginSchema, refreshSchema } from './auth.validation'
import * as authController from './auth.controller'

const router = Router()

router.post('/register', validate(registerSchema), asyncHandler(authController.register))
router.post('/login', validate(loginSchema), asyncHandler(authController.login))
router.post('/refresh', validate(refreshSchema), asyncHandler(authController.refresh))
router.post('/logout', asyncHandler(authController.logout))

export default router
