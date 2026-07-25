"use client"

import { useEffect, useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { todayStr } from "@/lib/helpers"
import { swrFetcher, SWR_CONFIG } from "@/lib/swr-fetcher"
import { apiClient } from "@/lib/api-client"
import { withLoading } from "@/lib/swal-action"
import type { Appointment, Barber, Client, Service } from "@/lib/types"
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
  const { data: clients = [] } = useSWR<Client[]>(open ? "/api/clients" : null, swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const { data: barbers = [] } = useSWR<Barber[]>(open ? "/api/barbers" : null, swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const { data: services = [] } = useSWR<Service[]>(open ? "/api/services" : null, swrFetcher, { ...SWR_CONFIG, fallbackData: [] })

  const [clientId, setClientId] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [barberId, setBarberId] = useState("")
  const [date, setDate] = useState(todayStr())
  const [time, setTime] = useState("")
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    if (!open || !editing) return
    setClientId(editing.clientId)
    setServiceId(editing.serviceId)
    setBarberId(editing.barberId)
    setDate(editing.date)
    setTime(editing.time)
  }, [editing, open])

  useEffect(() => {
    if (!open || editing) return
    if (clients.length > 0 && !clientId) setClientId(clients[0]?.id ?? "")
    if (services.length > 0 && !serviceId) setServiceId(services[0]?.id ?? "")
    if (barbers.length > 0 && !barberId) setBarberId(barbers[0]?.id ?? "")
  }, [open, clients, services, barbers, editing, clientId, serviceId, barberId])

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

  const { mutate } = useSWRConfig()

  async function submit() {
    if (!clientId || !serviceId || !barberId || !date || !time) return
    try {
      if (editing) {
        await withLoading(apiClient.patch(`/api/appointments/${editing.id}/status`, { status: "CANCELLED" }), { loading: "Cancelando turno anterior...", success: "Turno cancelado" })
        await withLoading(apiClient.post("/api/appointments", { clientId, barberId, serviceId, date, time }), { loading: "Creando nuevo turno...", success: "Turno creado" })
      } else {
        await withLoading(apiClient.post("/api/appointments", { clientId, barberId, serviceId, date, time }), { loading: "Creando turno...", success: "Turno creado" })
      }
      mutate("/api/appointments")
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
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Servicio">
          <Select value={serviceId} onChange={(e) => { setServiceId(e.target.value); setTime("") }}>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name} · {s.durationMin} min</option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Barbero">
            <Select value={barberId} onChange={(e) => { setBarberId(e.target.value); setTime("") }}>
              {barbers.filter((b) => b.active).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha">
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setTime("") }}
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
                    time === s ? "neu-inset text-primary" : "neu-raised-sm text-foreground hover:neu-raised",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={!time}>{editing ? "Guardar cambios" : "Crear turno"}</Button>
        </div>
      </div>
    </Modal>
  )
}
