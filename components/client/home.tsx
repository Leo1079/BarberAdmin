"use client"

import { CalendarPlus, Clock, Loader2, Scissors } from "lucide-react"
import useSWR from "swr"
import { Badge, Button, Card, EmptyState } from "@/components/ui-kit"
import { swrFetcher, SWR_CONFIG } from "@/lib/swr-fetcher"
import { formatDate, STATUS_META } from "@/lib/helpers"
import type { Appointment, Barber, Client, Service } from "@/lib/types"

export function ClientHome({ onNavigate }: { onNavigate: (v: string) => void }) {
  const { data: appointments = [] } = useSWR<Appointment[]>("/api/appointments", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const { data: services = [] } = useSWR<Service[]>("/api/services", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const { data: barbers = [] } = useSWR<Barber[]>("/api/barbers", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const { data: clients = [], isLoading } = useSWR<Client[]>("/api/clients", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const loading = isLoading

  if (loading) {
    return <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
  }

  const client = clients[0]
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = appointments
    .filter((a) => a.status !== "CANCELLED" && a.status !== "COMPLETED" && a.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  function svcName(id: string) { return services.find((s) => s.id === id)?.name ?? "Servicio" }
  function barberName(id: string) { return barbers.find((b) => b.id === id)?.name ?? "Barbero" }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Hola, {client?.name?.split(" ")[0] ?? "Cliente"}
          </h1>
          <p className="text-sm text-muted-foreground">Bienvenido a tu cuenta</p>
        </div>
        <Button onClick={() => onNavigate("book")}>
          <CalendarPlus className="size-4" /> Reservar turno
        </Button>
      </div>

      <Card>
        <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
          <Clock className="size-5 text-primary" /> Próximos turnos
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState text="No tenés turnos próximos." />
        ) : (
          <div className="space-y-3">
            {upcoming.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{svcName(a.serviceId)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(a.date)} · {a.time} hs · {barberName(a.barberId)}
                  </p>
                </div>
                <Badge className={STATUS_META[a.status].className}>{STATUS_META[a.status].label}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
          <Scissors className="size-5 text-primary" /> Resumen
        </h2>
        <p className="text-sm text-muted-foreground">
          {appointments.filter((a) => a.status === "COMPLETED").length} cortes realizados.
        </p>
      </Card>
    </div>
  )
}
