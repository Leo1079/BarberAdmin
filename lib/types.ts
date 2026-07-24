export type Role = "admin" | "barber" | "client" | "OWNER" | "BARBER" | "CLIENT"

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "WAITING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"

export type PaymentMethod = "EFECTIVO" | "TRANSFERENCIA" | "MERCADO_PAGO" | "TARJETA"
export type PaymentStatus = "PENDING" | "PAID"

export interface Payment {
  id: string
  appointmentId: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  createdAt?: number
}

export interface User {
  id: string
  email: string
  role: Role
  name?: string
  barberId?: string | null
  clientId?: string | null
}

export interface Service {
  id: string
  name: string
  price: number
  durationMin: number
  description?: string
  active?: boolean
}

export interface Barber {
  id: string
  name: string
  photo: string
  commissionPct: number
  active: boolean
  workStart: string // "09:00"
  workEnd: string // "20:00"
  phone?: string
  address?: string
  user?: {
    id: string
    email: string
  }
}

export interface Client {
  id: string
  name: string
  phone: string
  email: string
  active?: boolean
}

export interface Appointment {
  id: string
  clientId: string
  barberId: string
  serviceId: string
  date: string // "2026-07-18"
  time: string // "14:30"
  status: AppointmentStatus
  createdAt: number
  payment?: Payment
  client?: { id: string; name: string }
  barber?: { id: string; name: string }
  service?: { id: string; name: string; price: number; durationMin: number }
}

export type MovementType = "income" | "expense"

export interface CashMovement {
  id: string
  type: MovementType
  amount: number
  description: string
  category: string
  date: string // "2026-07-18"
  createdAt: number
  appointmentId?: string
  barberId?: string
}

export type AdjustmentType = "advance" | "discount"

export interface Adjustment {
  id: string
  barberId: string
  type: AdjustmentType
  amount: number
  description: string
  date: string
  barber?: { name: string }
}

export interface Payout {
  id: string
  barberId: string
  date: string
  totalGenerated: number
  commissionPct: number
  commission: number
  advances: number
  discounts: number
  total: number
  barber?: { id: string; name: string; commissionPct: number }
  appointments?: Array<{
    appointment: {
      id: string
      time: string
      service: { name: string; price: number }
    }
  }>
}

export type AdvanceRequestStatus = "pending" | "approved" | "rejected"

export interface AdvanceRequest {
  id: string
  barberId: string
  amount: number
  description: string
  date: string
  status: AdvanceRequestStatus
  barber?: { name: string }
}

export interface AppNotification {
  id: string
  clientId: string
  message: string
  date: number
  read: boolean
}

export interface Settings {
  shopName: string
  address: string
  phone: string
  openDays: string[] // ["Lun","Mar",...]
  openHour: string
  closeHour: string
  slotMinutes: number
}

export interface AppState {
  services: Service[]
  barbers: Barber[]
  clients: Client[]
  appointments: Appointment[]
  movements: CashMovement[]
  adjustments: Adjustment[]
  advanceRequests: AdvanceRequest[]
  payouts: Payout[]
  notifications: AppNotification[]
  settings: Settings
}
