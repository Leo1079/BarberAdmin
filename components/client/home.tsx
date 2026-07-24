"use client"

import { CalendarPlus, Clock, Loader2, Scissors } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Badge, Button, Card, EmptyState } from "@/components/ui-kit"
import { apiClient } from "@/lib/api-client"
import { formatDate, STATUS_META } from "@/lib/helpers"
import type { Appointment, Barber, Client, Service } from "@/lib/types"

export function ClientHome({ onNavigate }: { onNavigate: (v: string) => void }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [appts, svcs, brbs, clts] = await Promise.all([
        apiClient.get<Appointment[]>("/api/appointments"),
        apiClient.get<Service[]>("/api/services"),
        apiClient.get<Barber[]>("/api/barbers"),
        apiClient.get<Client[]>("/api/clients"),
      ])
      setAppointments(appts)
      setServices(svcs)
      setBarbers(brbs)
      setClients(clts)
    } catch {
      // silence
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
  }

  const client = clients[0]
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = appointments
    .filter((a) => a.status !== "CANCELLED" && a.status !== "COMPLETED" && a.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  const next = upcoming[0]
  const nextSvc = services.find((s) => s.id === next?.serviceId)
  const nextBarber = barbers.find((b) => b.id === next?.barberId)

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Hola de nuevo,</p>
        <h1 className="font-serif text-2xl font-semibold text-foreground">{client?.name ?? "Cliente"}</h1>
      </div>

      <Card className="mb-6 neu-raised">
        <div className="mb-3 flex items-center gap-2 text-primary">
          <Clock className="size-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">Tu próximo turno</span>
        </div>
        {next ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-serif text-xl font-semibold text-foreground">{nextSvc?.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDate(next.date)} · {next.time} hs · con {nextBarber?.name}
              </p>
            </div>
            <Badge className={STATUS_META[next.status].className}>
              {STATUS_META[next.status].label}
            </Badge>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">No tenés turnos próximos.</p>
            <Button onClick={() => onNavigate("book")}>
              <CalendarPlus className="size-4" /> Reservar ahora
            </Button>
          </div>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => onNavigate("book")}
          className="flex items-center gap-4 rounded-2xl neu-raised p-5 text-left transition-all duration-200 hover:neu-raised-sm"
        >
          <div className="flex size-11 items-center justify-center rounded-xl neu-raised-sm text-primary">
            <CalendarPlus className="size-5" />
          </div>
          <div>
            <p className="font-medium text-foreground">Reservar turno</p>
            <p className="text-sm text-muted-foreground">Elegí servicio, barbero y horario</p>
          </div>
        </button>
        <button
          onClick={() => onNavigate("appointments")}
          className="flex items-center gap-4 rounded-2xl neu-raised p-5 text-left transition-all duration-200 hover:neu-raised-sm"
        >
          <div className="flex size-11 items-center justify-center rounded-xl neu-raised-sm text-primary">
            <Scissors className="size-5" />
          </div>
          <div>
            <p className="font-medium text-foreground">Mis turnos</p>
            <p className="text-sm text-muted-foreground">{upcoming.length} activos</p>
          </div>
        </button>
      </div>

      {upcoming.length <= 1 && next && (
        <div className="mt-6">
          <EmptyState text="No hay más turnos programados." />
        </div>
      )}
    </div>
  )
}
