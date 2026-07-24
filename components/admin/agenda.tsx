"use client"

import { Pencil, Plus, X, Loader2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { AppointmentForm } from "@/components/appointment-form"
import { Badge, Button, Card, SectionTitle, Select } from "@/components/ui-kit"
import { formatDate, STATUS_META } from "@/lib/helpers"
import { todayStr } from "@/lib/seed"
import { apiClient } from "@/lib/api-client"
import type { Appointment, AppointmentStatus } from "@/lib/types"

const STATUS_OPTIONS: AppointmentStatus[] = ["PENDING", "CONFIRMED", "WAITING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]

export function AdminAgenda() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [date, setDate] = useState(todayStr())
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)

  useEffect(() => {
    setLoading(true)
    apiClient.get<Appointment[]>(`/api/appointments?date=${date}`)
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false))
  }, [date])

  async function updateStatus(id: string, status: AppointmentStatus) {
    setUpdatingId(id)
    const prev = [...appointments]
    setAppointments((a) => a.map((x) => x.id === id ? { ...x, status } : x))
    try {
      await apiClient.patch(`/api/appointments/${id}/status`, { status })
    } catch {
      setAppointments(prev)
    } finally {
      setUpdatingId(null)
    }
  }

  const dayAppts = useMemo(
    () =>
      appointments
        .filter((a) => a.date === date)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, date],
  )

  return (
    <div>
      <SectionTitle
        title="Agenda general"
        subtitle="Todos los turnos del negocio"
        action={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Nuevo turno
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary [color-scheme:dark]"
        />
        <span className="text-sm capitalize text-muted-foreground">{formatDate(date)}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : dayAppts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No hay turnos para este día.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {dayAppts.map((a) => (
            <Card key={a.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3 sm:w-48 shrink-0">
                <span className="font-serif text-lg font-semibold tabular-nums text-primary">{a.time}</span>
                <Badge className={STATUS_META[a.status].className}>{STATUS_META[a.status].label}</Badge>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{a.client?.name ?? "—"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {a.service?.name ?? "—"} · {a.service?.durationMin ?? "—"} min
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Select
                  value={a.status}
                  onChange={(e) => updateStatus(a.id, e.target.value as AppointmentStatus)}
                  className="w-full sm:w-32"
                  disabled={updatingId === a.id}
                  aria-label="Cambiar estado"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_META[s].label}
                    </option>
                  ))}
                </Select>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(a)} disabled={updatingId === a.id} aria-label="Editar">
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateStatus(a.id, "CANCELLED")}
                      disabled={updatingId === a.id}
                      aria-label="Cancelar turno"
                    >
                      {updatingId === a.id ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4 text-destructive" />}
                    </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {creating && <AppointmentForm open onClose={() => setCreating(false)} />}
      {editing && <AppointmentForm open editing={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
