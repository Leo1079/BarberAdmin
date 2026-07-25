"use client"

import { CalendarPlus, Loader2, RotateCcw, X } from "lucide-react"
import { useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { Badge, Button, Card, EmptyState, Field, Modal, Select } from "@/components/ui-kit"
import { swrFetcher, SWR_CONFIG } from "@/lib/swr-fetcher"
import { apiClient } from "@/lib/api-client"
import { withLoading } from "@/lib/swal-action"
import { formatDate, STATUS_META } from "@/lib/helpers"
import type { Appointment, Barber, Service } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

const RESCHEDULE_MIN_HOURS = 2

function hoursUntil(date: string, time: string): number {
  const target = new Date(`${date}T${time}:00`).getTime()
  return (target - Date.now()) / (1000 * 60 * 60)
}

export function ClientAppointments({ onBook }: { onBook: () => void }) {
  const [reschedule, setReschedule] = useState<Appointment | null>(null)

  const { data: appointments = [] } = useSWR<Appointment[]>("/api/appointments", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const { data: services = [] } = useSWR<Service[]>("/api/services", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const { data: barbers = [], isLoading } = useSWR<Barber[]>("/api/barbers", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const loading = isLoading

  const { mutate } = useSWRConfig()

  const mine = appointments.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
  const active = mine.filter((a) => a.status !== "COMPLETED" && a.status !== "CANCELLED")
  const past = mine.filter((a) => a.status === "COMPLETED" || a.status === "CANCELLED")

  function svcName(id: string) { return services.find((s) => s.id === id)?.name ?? "Servicio" }
  function barberName(id: string) { return barbers.find((b) => b.id === id)?.name ?? "Barbero" }

  async function handleCancel(id: string) {
    try {
      await withLoading(apiClient.patch(`/api/appointments/${id}/status`, { status: "CANCELLED" }), { loading: "Cancelando turno...", success: "Turno cancelado" })
      mutate("/api/appointments")
    } catch {
      alert("Error al cancelar el turno")
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Mis turnos</h1>
        <Button onClick={onBook}><CalendarPlus className="size-4" /> Reservar</Button>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Activos</h2>
      {active.length === 0 ? (
        <EmptyState text="No tenés turnos activos." />
      ) : (
        <div className="space-y-3">
          {active.map((a) => {
            const canModify = hoursUntil(a.date, a.time) >= RESCHEDULE_MIN_HOURS
            return (
              <Card key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{svcName(a.serviceId)}</p>
                    <Badge className={STATUS_META[a.status].className}>{STATUS_META[a.status].label}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground truncate">
                    {formatDate(a.date)} · {a.time} hs · con {barberName(a.barberId)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                    <Button size="sm" variant="danger" disabled={!canModify} onClick={() => handleCancel(a.id)} className="flex-1 sm:flex-none">
                      <X className="size-3.5" /> <span className="sm:hidden">Cancelar</span>
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Historial</h2>
      {past.length === 0 ? (
        <EmptyState text="Todavía no tenés turnos pasados." />
      ) : (
        <div className="space-y-2">
          {past.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{svcName(a.serviceId)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(a.date)} · {barberName(a.barberId)}</p>
              </div>
              <Badge className={STATUS_META[a.status].className}>{STATUS_META[a.status].label}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
