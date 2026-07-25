import type { AppointmentStatus } from "./types"

export function money(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short" })
}

export const STATUS_META: Record<AppointmentStatus, { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: "bg-warning/15 text-warning border-warning/30" },
  CONFIRMED: { label: "Confirmado", className: "bg-primary/15 text-primary border-primary/30" },
  WAITING: { label: "En espera", className: "bg-warning/15 text-warning border-warning/30" },
  IN_PROGRESS: { label: "En proceso", className: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  COMPLETED: { label: "Completado", className: "bg-success/15 text-success border-success/30" },
  CANCELLED: { label: "Cancelado", className: "bg-destructive/15 text-destructive border-destructive/30" },
  NO_SHOW: { label: "No asistió", className: "bg-destructive/15 text-destructive border-destructive/30" },
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function todayStr(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function addDaysStr(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return todayStr(d)
}
