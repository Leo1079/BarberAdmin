"use client"

import { CheckCircle2, Flag, Loader2, Play, X } from "lucide-react"
import { useEffect, useState } from "react"
import { AppointmentStatusButton } from "./status-button"
import { Badge, Button, Card, Field, Modal, SectionTitle, Select } from "@/components/ui-kit"
import { formatDate, money, STATUS_META } from "@/lib/helpers"
import { addDaysStr, todayStr } from "@/lib/seed"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api-client"
import type { Appointment } from "@/lib/types"

const PAYMENT_METHODS = ["EFECTIVO", "TRANSFERENCIA", "MERCADO_PAGO", "TARJETA"] as const

export function BarberAgenda() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentModal, setPaymentModal] = useState<{ appt: Appointment; amount: number } | null>(null)
  const today = todayStr()
  const tomorrow = addDaysStr(1)

  useEffect(() => {
    setLoading(true)
    apiClient.get<Appointment[]>("/api/appointments")
      .then(setAppointments)
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false))
  }, [])

  async function updateStatus(id: string, status: string) {
    const prev = [...appointments]
    setAppointments((a) => a.map((x) => x.id === id ? { ...x, status: status as any } : x))
    try {
      await apiClient.patch(`/api/appointments/${id}/status`, { status })
    } catch {
      setAppointments(prev)
    }
  }

  function handleComplete(appt: Appointment) {
    const svcPrice = appt.service?.price ?? 0
    setPaymentModal({ appt, amount: svcPrice })
  }

  async function confirmPayment(apptId: string, amount: number, method: string) {
    const prev = [...appointments]
    setAppointments((a) => a.map((x) => x.id === apptId ? { ...x, status: "COMPLETED" as any } : x))
    try {
      await apiClient.post("/api/payments", { appointmentId: apptId, amount, method })
      await apiClient.patch(`/api/appointments/${apptId}/status`, { status: "COMPLETED" })
      setPaymentModal(null)
    } catch (err: any) {
      setAppointments(prev)
      throw err
    }
  }

  const barberId = user?.barberId

  const forDay = (date: string) =>
    appointments
      .filter((a) => a.barberId === barberId && a.date === date)
      .sort((a, b) => a.time.localeCompare(b.time))

  return (
    <div>
      <SectionTitle title="Mi Agenda" subtitle="Gestioná el estado de tus turnos" />
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <DaySection title="Hoy" date={today} appts={forDay(today)} onStatusChange={updateStatus} onComplete={handleComplete} />
          <div className="mt-6">
            <DaySection title="Mañana" date={tomorrow} appts={forDay(tomorrow)} onStatusChange={updateStatus} onComplete={handleComplete} />
          </div>
        </>
      )}

      {paymentModal && (
        <PaymentModal
          appointment={paymentModal.appt}
          defaultAmount={paymentModal.amount}
          onSubmit={(method) => confirmPayment(paymentModal.appt.id, paymentModal.amount, method)}
          onClose={() => setPaymentModal(null)}
        />
      )}
    </div>
  )
}

const VALID_TRANSITIONS: Record<string, { label: string; variant: "primary" | "success"; icon: typeof Play; nextStatus: string }[]> = {
  PENDING: [
    { label: "Confirmar", variant: "primary", icon: CheckCircle2, nextStatus: "CONFIRMED" },
  ],
  CONFIRMED: [
    { label: "Iniciar", variant: "primary", icon: Play, nextStatus: "WAITING" },
  ],
  WAITING: [
    { label: "En proceso", variant: "primary", icon: Play, nextStatus: "IN_PROGRESS" },
  ],
}

function DaySection({ title, date, appts, onStatusChange, onComplete }: { title: string; date: string; appts: Appointment[]; onStatusChange: (id: string, status: string) => void; onComplete: (appt: Appointment) => void }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-serif text-lg font-semibold">{title}</h2>
        <span className="text-sm capitalize text-muted-foreground">· {formatDate(date)}</span>
      </div>
      {appts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          Sin turnos.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {appts.map((a) => {
            const transitions = VALID_TRANSITIONS[a.status] ?? []
            const canCancel = a.status === "PENDING" || a.status === "CONFIRMED"
            return (
              <Card key={a.id} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 sm:w-40 shrink-0">
                  <span className="font-serif text-lg font-semibold tabular-nums text-primary">{a.time}</span>
                  <Badge className={STATUS_META[a.status].className}>{STATUS_META[a.status].label}</Badge>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{a.client?.name ?? "—"}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.service?.name ?? "—"}</p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {transitions.map((t) => (
                    <AppointmentStatusButton
                      key={t.nextStatus}
                      icon={t.icon}
                      label={t.label}
                      variant={t.variant}
                      onClick={() => onStatusChange(a.id, t.nextStatus)}
                    />
                  ))}
                  {a.status === "IN_PROGRESS" && (
                    <AppointmentStatusButton
                      icon={Flag}
                      label="Finalizar"
                      variant="success"
                      onClick={() => onComplete(a)}
                    />
                  )}
                  {canCancel && (
                    <AppointmentStatusButton
                      icon={X}
                      label="Cancelar"
                      variant="ghost"
                      onClick={() => onStatusChange(a.id, "CANCELLED")}
                    />
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PaymentModal({ appointment, defaultAmount, onSubmit, onClose }: { appointment: Appointment; defaultAmount: number; onSubmit: (method: string) => void; onClose: () => void }) {
  const [amount, setAmount] = useState(String(defaultAmount))
  const [method, setMethod] = useState<string>("EFECTIVO")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    const value = Number(amount)
    if (!value || value <= 0) { setError("Monto inválido"); return }
    setSubmitting(true)
    setError("")
    try {
      await onSubmit(method)
      onClose()
    } catch (err: any) {
      setError(err?.message ?? "Error al procesar pago")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Registrar pago">
      <div className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          Pago para turno de {appointment.time} hs
        </p>
        <Field label="Monto">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary [color-scheme:dark]"
            autoFocus
          />
        </Field>
        <Field label="Método de pago">
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Select>
        </Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="success" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Confirmar pago
          </Button>
        </div>
      </div>
    </Modal>
  )
}
