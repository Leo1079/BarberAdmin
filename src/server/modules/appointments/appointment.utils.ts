export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

type TransitionRule = {
  allowedRoles: string[]
}

const stateMachine: Record<AppointmentStatus, Partial<Record<AppointmentStatus, TransitionRule>>> = {
  PENDING: {
    CONFIRMED: { allowedRoles: ['OWNER', 'BARBER'] },
    IN_PROGRESS: { allowedRoles: ['OWNER', 'BARBER'] },
    COMPLETED: { allowedRoles: ['OWNER', 'BARBER'] },
    CANCELLED: { allowedRoles: ['OWNER', 'BARBER', 'CLIENT'] },
  },
  CONFIRMED: {
    WAITING: { allowedRoles: ['OWNER', 'BARBER'] },
    CANCELLED: { allowedRoles: ['OWNER', 'BARBER'] },
    NO_SHOW: { allowedRoles: ['OWNER', 'BARBER'] },
  },
  WAITING: {
    IN_PROGRESS: { allowedRoles: ['OWNER', 'BARBER'] },
    CANCELLED: { allowedRoles: ['OWNER', 'BARBER'] },
  },
  IN_PROGRESS: {
    COMPLETED: { allowedRoles: ['OWNER', 'BARBER'] },
  },
  COMPLETED: {},
  CANCELLED: {},
  NO_SHOW: {},
}

export function canTransition(from: AppointmentStatus, to: AppointmentStatus, role: string): boolean {
  const transitions = stateMachine[from]
  if (!transitions) return false
  const rule = transitions[to]
  if (!rule) return false
  return rule.allowedRoles.includes(role)
}
