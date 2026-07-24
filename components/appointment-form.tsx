"use client"

import { useCallback, useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import { todayStr } from "@/lib/seed"
import { apiClient } from "@/lib/api-client"
import type { Appointment } from "@/lib/types"
import { Button, Field, Modal, Select, cn } from "./ui-kit"

export function AppointmentForm({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing?: Appointment | null
}) {
  const store = useStore()
  const { clients, barbers, services } = store

  const [clientId, setClientId] = useState(editing?.clientId ?? clients[0]?.id ?? "")
  const [serviceId, setServiceId] = useState(editing?.serviceId ?? services[0]?.id ?? "")
  const [barberId, setBarberId] = useState(editing?.barberId ?? barbers[0]?.id ?? "")
  const [date, setDate] = useState(editing?.date ?? todayStr())
  const [time, setTime] = useState(editing?.time ?? "")
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const service = services.find((s) => s.id === serviceId)

  useEffect(() => {
    if (!service || !barberId || !date) return
    setLoadingSlots(true)
    setTime("")
    apiClient.get<string[]>(
      `/api/schedules/availability?barberId=${barberId}&serviceId=${service.id}&date=${date}`
    )
      .then((s) => {
        let result = s
        if (editing && editing.barberId === barberId && editing.date === date && !result.includes(editing.time)) {
          result = [editing.time, ...result].sort()
        }
        setSlots(result)
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [barberId, service?.id, date, editing])

  async function submit() {
    if (!clientId || !serviceId || !barberId || !date || !time) return
    try {
      if (editing) {
        await apiClient.patch(`/api/appointments/${editing.id}/status`, { status: "CANCELLED" })
        await apiClient.post("/api/appointments", { clientId, barberId, serviceId, date, time })
      } else {
        await apiClient.post("/api/appointments", { clientId, barberId, serviceId, date, time })
      }
      onClose()
    } catch {
      // error handling
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar turno" : "Nuevo turno"}>
      <div className="grid gap-4">
        <Field label="Cliente">
          <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Servicio">
          <Select
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value)
              setTime("")
            }}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.durationMin} min
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Barbero">
            <Select
              value={barberId}
              onChange={(e) => {
                setBarberId(e.target.value)
                setTime("")
              }}
            >
              {barbers.filter((b) => b.active).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha">
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setTime("")
              }}
              className="w-full rounded-xl neu-inset px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/20 [color-scheme:dark]"
            />
          </Field>
        </div>
        <Field label="Horario disponible">
          {loadingSlots ? (
            <p className="rounded-xl neu-inset px-3 py-2 text-xs text-muted-foreground">Cargando...</p>
          ) : slots.length === 0 ? (
            <p className="rounded-xl neu-inset px-3 py-2 text-xs text-muted-foreground">
              No hay horarios libres para esta combinación.
            </p>
          ) : (
            <div className="grid max-h-40 grid-cols-4 gap-2 overflow-y-auto p-1">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTime(s)}
                  className={cn(
                    "rounded-xl px-2 py-1.5 text-xs font-medium transition-all duration-200",
                    time === s
                      ? "neu-inset text-primary"
                      : "neu-raised-sm text-foreground hover:neu-raised"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!time}>
            {editing ? "Guardar cambios" : "Crear turno"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
