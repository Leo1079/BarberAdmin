import type { Request, Response } from 'express'
import * as scheduleService from './schedule.service'

export async function getSchedules(req: Request, res: Response) {
  const schedules = await scheduleService.getSchedules(req.params.barberId)
  res.json(schedules)
}

export async function upsertSchedule(req: Request, res: Response) {
  const schedule = await scheduleService.upsertSchedule(req.body)
  res.json(schedule)
}

export async function deleteSchedule(req: Request, res: Response) {
  await scheduleService.deleteSchedule(req.params.barberId, Number(req.params.dayOfWeek))
  res.status(204).end()
}

export async function getExceptions(req: Request, res: Response) {
  const exceptions = await scheduleService.getExceptions(req.params.barberId)
  res.json(exceptions)
}

export async function upsertException(req: Request, res: Response) {
  const exc = await scheduleService.upsertException(req.body)
  res.json(exc)
}

export async function deleteException(req: Request, res: Response) {
  await scheduleService.deleteException(req.params.barberId, req.params.date)
  res.status(204).end()
}

export async function getAvailability(req: Request, res: Response) {
  const { barberId, serviceId, date } = req.query as Record<string, string>
  const slots = await scheduleService.getAvailability(barberId, serviceId, date)
  res.json(slots)
}
