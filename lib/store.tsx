"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { createSeed, todayStr } from "./seed"
import { useAuth } from "./auth-context"
import type {
  Adjustment,
  AdvanceRequest,
  AppNotification,
  AppState,
  Appointment,
  AppointmentStatus,
  Barber,
  Client,
  CashMovement,
  Payout,
  Role,
  Service,
  Settings,
} from "./types"

const STATE_KEY = "barber_app_state_v1"
const SESSION_KEY = "barber_app_session_v1"

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

interface Session {
  role: Role
  barberId: string
  clientId: string
}

interface StoreContextValue extends AppState {
  session: Session
  setRole: (role: Role) => void
  setActiveBarber: (id: string) => void
  setActiveClient: (id: string) => void

  addMovement: (m: Omit<CashMovement, "id" | "createdAt">) => void
  deleteMovement: (id: string) => void

  saveService: (s: Omit<Service, "id"> & { id?: string }) => void
  deleteService: (id: string) => void

  saveBarber: (b: Omit<Barber, "id"> & { id?: string }) => void
  deleteBarber: (id: string) => void

  saveClient: (c: Omit<Client, "id"> & { id?: string }) => string
  deleteClient: (id: string) => void

  createAppointment: (a: Omit<Appointment, "id" | "createdAt" | "status"> & { status?: AppointmentStatus }) => void
  registerWalkInCut: (data: { clientId: string; barberId: string; serviceId: string; date: string; time: string }) => void
  updateAppointment: (id: string, patch: Partial<Appointment>) => void
  setAppointmentStatus: (id: string, status: AppointmentStatus) => void
  cancelAppointment: (id: string) => void

  addAdjustment: (a: Omit<Adjustment, "id">) => void

  requestAdvance: (barberId: string, amount: number, description: string) => void
  approveAdvanceRequest: (id: string) => void
  rejectAdvanceRequest: (id: string) => void

  registerPayout: (p: Omit<Payout, "id">) => void

  markNotificationsRead: (clientId: string) => void
  pushNotification: (clientId: string, message: string) => void

  updateSettings: (patch: Partial<Settings>) => void
  resetData: () => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<AppState>(() => createSeed())
  const [localSession, setLocalSession] = useState<Session>({ role: "admin", barberId: "b1", clientId: "c1" })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const rawState = localStorage.getItem(STATE_KEY)
      if (rawState) setState(JSON.parse(rawState))
      const rawSession = localStorage.getItem(SESSION_KEY)
      if (rawSession) setLocalSession(JSON.parse(rawSession))
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem(STATE_KEY, JSON.stringify(state))
  }, [state, hydrated])

  useEffect(() => {
    if (hydrated) localStorage.setItem(SESSION_KEY, JSON.stringify(localSession))
  }, [localSession, hydrated])

  const session = useMemo(() => {
    if (user) {
      let roleMapped: Role = "client"
      const userRole = (user.role || "").toUpperCase()
      if (userRole === "OWNER" || userRole === "ADMIN") {
        roleMapped = "admin"
      } else if (userRole === "BARBER") {
        roleMapped = "barber"
      }

      return {
        role: roleMapped,
        barberId: user.barberId || localSession.barberId || "b1",
        clientId: user.clientId || localSession.clientId || "c1",
      }
    }
    return localSession
  }, [user, localSession])

  const pushNotification = useCallback((clientId: string, message: string) => {
    setState((s) => ({
      ...s,
      notifications: [
        { id: uid("n"), clientId, message, date: Date.now(), read: false },
        ...s.notifications,
      ],
    }))
  }, [])

  const value = useMemo<StoreContextValue>(() => {
    return {
      ...state,
      session,
      setRole: (role) => setLocalSession((p) => ({ ...p, role })),
      setActiveBarber: (barberId) => setLocalSession((p) => ({ ...p, barberId })),
      setActiveClient: (clientId) => setLocalSession((p) => ({ ...p, clientId })),

      addMovement: (m) =>
        setState((s) => ({
          ...s,
          movements: [{ ...m, id: uid("m"), createdAt: Date.now() }, ...s.movements],
        })),
      deleteMovement: (id) =>
        setState((s) => ({ ...s, movements: s.movements.filter((m) => m.id !== id) })),

      saveService: (svc) =>
        setState((s) => {
          if (svc.id) {
            return {
              ...s,
              services: s.services.map((x) => (x.id === svc.id ? { ...x, ...svc } as Service : x)),
            }
          }
          return { ...s, services: [...s.services, { ...svc, id: uid("s") } as Service] }
        }),
      deleteService: (id) =>
        setState((s) => ({ ...s, services: s.services.filter((x) => x.id !== id) })),

      saveBarber: (b) =>
        setState((s) => {
          if (b.id) {
            return {
              ...s,
              barbers: s.barbers.map((x) => (x.id === b.id ? { ...x, ...b } as Barber : x)),
            }
          }
          return {
            ...s,
            barbers: [
              ...s.barbers,
              { ...b, photo: b.photo || "/thoughtful-barber.png", id: uid("b") } as Barber,
            ],
          }
        }),
      deleteBarber: (id) =>
        setState((s) => ({ ...s, barbers: s.barbers.filter((x) => x.id !== id) })),

      saveClient: (c) => {
        let newId = c.id ?? uid("c")
        setState((s) => {
          if (c.id) {
            return {
              ...s,
              clients: s.clients.map((x) => (x.id === c.id ? { ...x, ...c } as Client : x)),
            }
          }
          return { ...s, clients: [...s.clients, { ...c, id: newId } as Client] }
        })
        return newId
      },
      deleteClient: (id) =>
        setState((s) => ({ ...s, clients: s.clients.filter((x) => x.id !== id) })),

      createAppointment: (a) =>
        setState((s) => ({
          ...s,
          appointments: [
            { ...a, id: uid("a"), createdAt: Date.now(), status: a.status ?? "PENDING" },
            ...s.appointments,
          ],
        })),

      registerWalkInCut: (data) =>
        setState((s) => {
          const svc = s.services.find((x) => x.id === data.serviceId)
          const client = s.clients.find((x) => x.id === data.clientId)
          const appt: Appointment = {
            id: uid("a"),
            clientId: data.clientId,
            barberId: data.barberId,
            serviceId: data.serviceId,
            date: data.date,
            time: data.time,
            status: "COMPLETED",
            createdAt: Date.now(),
          }
          const movement: CashMovement = {
            id: uid("m"),
            type: "income",
            amount: svc?.price ?? 0,
            description: `${svc?.name ?? "Servicio"} - ${client?.name ?? "Cliente"}`,
            category: "Servicio",
            date: data.date,
            createdAt: Date.now(),
            appointmentId: appt.id,
            barberId: data.barberId,
          }
          return {
            ...s,
            appointments: [appt, ...s.appointments],
            movements: [movement, ...s.movements],
          }
        }),

      updateAppointment: (id, patch) =>
        setState((s) => ({
          ...s,
          appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),

      setAppointmentStatus: (id, status) =>
        setState((s) => {
          const appt = s.appointments.find((a) => a.id === id)
          if (!appt) return s
          const appointments = s.appointments.map((a) => (a.id === id ? { ...a, status } : a))
          let movements = s.movements
          let notifications = s.notifications
          const svc = s.services.find((x) => x.id === appt.serviceId)
          const client = s.clients.find((x) => x.id === appt.clientId)
          const barber = s.barbers.find((x) => x.id === appt.barberId)

          // On finishing, register income in cash (avoid duplicates)
          if (status === "COMPLETED" && !s.movements.some((m) => m.appointmentId === id)) {
            movements = [
              {
                id: uid("m"),
                type: "income",
                amount: svc?.price ?? 0,
                description: `${svc?.name ?? "Servicio"} - ${client?.name ?? "Cliente"}`,
                category: "Servicio",
                date: appt.date,
                createdAt: Date.now(),
                appointmentId: id,
                barberId: appt.barberId,
              },
              ...movements,
            ]
          }

          const statusMsg: Partial<Record<AppointmentStatus, string>> = {
            CONFIRMED: `Tu turno de ${svc?.name ?? "servicio"} fue confirmado por ${barber?.name ?? "el barbero"}.`,
            IN_PROGRESS: `${barber?.name ?? "Tu barbero"} inició tu servicio de ${svc?.name ?? "corte"}.`,
            COMPLETED: `Tu servicio de ${svc?.name ?? "corte"} fue finalizado. ¡Gracias por tu visita!`,
            CANCELLED: `Tu turno de ${svc?.name ?? "servicio"} fue cancelado.`,
          }
          if (statusMsg[status]) {
            notifications = [
              { id: uid("n"), clientId: appt.clientId, message: statusMsg[status] as string, date: Date.now(), read: false },
              ...notifications,
            ]
          }

          return { ...s, appointments, movements, notifications }
        }),

      cancelAppointment: (id) =>
        setState((s) => ({
          ...s,
          appointments: s.appointments.map((a) => (a.id === id ? { ...a, status: "CANCELLED" } : a)),
        })),

      addAdjustment: (a) =>
        setState((s) => ({ ...s, adjustments: [{ ...a, id: uid("adj") }, ...s.adjustments] })),

      requestAdvance: (barberId, amount, description) =>
        setState((s) => ({
          ...s,
          advanceRequests: [
            {
              id: uid("ar"),
              barberId,
              amount,
              description,
              date: todayStr(),
              status: "PENDING",
            },
            ...s.advanceRequests,
          ],
        })),

      approveAdvanceRequest: (id) =>
        setState((s) => {
          const req = s.advanceRequests.find((r) => r.id === id)
          if (!req || req.status !== "PENDING") return s
          return {
            ...s,
            advanceRequests: s.advanceRequests.map((r) =>
              r.id === id ? { ...r, status: "approved" } : r,
            ),
            adjustments: [
              {
                id: uid("adj"),
                barberId: req.barberId,
                type: "advance",
                amount: req.amount,
                description: req.description,
                date: todayStr(),
              },
              ...s.adjustments,
            ],
          }
        }),

      rejectAdvanceRequest: (id) =>
        setState((s) => ({
          ...s,
          advanceRequests: s.advanceRequests.map((r) =>
            r.id === id ? { ...r, status: "rejected" } : r,
          ),
        })),

      registerPayout: (p) =>
        setState((s) => ({
          ...s,
          payouts: [{ ...p, id: uid("pay") }, ...s.payouts],
          movements: [
            {
              id: uid("m"),
              type: "expense",
              amount: p.total,
              description: `Liquidación a ${s.barbers.find((b) => b.id === p.barberId)?.name ?? "barbero"}`,
              category: "Liquidación",
              date: p.date,
              createdAt: Date.now(),
              barberId: p.barberId,
            },
            ...s.movements,
          ],
        })),

      markNotificationsRead: (clientId) =>
        setState((s) => ({
          ...s,
          notifications: s.notifications.map((n) =>
            n.clientId === clientId ? { ...n, read: true } : n,
          ),
        })),

      pushNotification,

      updateSettings: (patch) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })),

      resetData: () => {
        const seed = createSeed()
        setState(seed)
      },
    }
  }, [state, session, pushNotification])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}

export { todayStr }
