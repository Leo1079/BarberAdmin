import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { validate } from '../../middleware/validate'
import { requireAuth } from '../../middleware/auth'
import { requireRole } from '../../middleware/authorize'
import { prisma } from '../../config/database'
import { createClientSchema, updateClientSchema } from './client.validation'
import * as clientController from './client.controller'

const router = Router()

router.use(requireAuth)

router.get('/', asyncHandler(async (req, res) => {
  if (req.user!.role === 'CLIENT') {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { clientId: true } })
    if (!user?.clientId) { res.json([]); return }
    const client = await prisma.client.findUnique({ where: { id: user.clientId } })
    res.json(client ? [client] : [])
    return
  }
  await clientController.list(req, res)
}))

router.get('/:id', asyncHandler(async (req, res) => {
  if (req.user!.role === 'CLIENT') {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { clientId: true } })
    if (user?.clientId !== req.params.id) { res.status(403).json({ error: 'Forbidden' }); return }
  }
  await clientController.getById(req, res)
}))

router.post('/', requireRole('OWNER', 'BARBER'), validate(createClientSchema), asyncHandler(clientController.create))
router.patch('/:id', requireRole('OWNER'), validate(updateClientSchema), asyncHandler(clientController.update))
router.patch('/:id/toggle-active', requireRole('OWNER'), asyncHandler(clientController.toggleActive))

export default router
