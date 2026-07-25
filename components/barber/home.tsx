"use client"

import { CalendarClock, Loader2, Scissors, Wallet } from "lucide-react"
import { useMemo, useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { StatCard } from "@/components/stat-card"
import { Badge, Button, Card, Field, Input, Modal, SectionTitle, Select } from "@/components/ui-kit"
import { swrFetcher, SWR_CONFIG } from "@/lib/swr-fetcher"
import { apiClient } from "@/lib/api-client"
import { withLoading } from "@/lib/swal-action"
import { formatDate, money, STATUS_META } from "@/lib/helpers"
import { useAuth } from "@/lib/auth-context"
import type { Appointment, Barber, Client, Service } from "@/lib/types"
import Swal from "sweetalert2"

export function BarberHome({ onNavigate }: { onNavigate: (k: string) => void }) {
  const { user } = useAuth()

  const { data: appointments = [] } = useSWR<Appointment[]>("/api/appointments", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const { data: services = [] } = useSWR<Service[]>("/api/services", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const { data: barbers = [], isLoading } = useSWR<Barber[]>("/api/barbers", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const { data: clients = [] } = useSWR<Client[]>("/api/clients", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const loading = isLoading

  const { mutate } = useSWRConfig()

  const barber = barbers.find((b) => b.id === user?.barberId)
  const today = new Date().toISOString().slice(0, 10)
  const pct = barber?.commissionPct ?? 0

  const todayAppts = appointments
    .filter((a) => a.barberId === user?.barberId && a.date === today && a.status !== "CANCELLED")
    .sort((a, b) => a.time.localeCompare(b.time))
  const cutsToday = todayAppts.filter((a) => a.status === "COMPLETED").length

  const genToday = todayAppts
    .filter((a) => a.status === "COMPLETED")
    .reduce((s, a) => {
      const svc = services.find((x) => x.id === a.serviceId)
      return s + (svc?.price ?? 0)
    }, 0)

  const nextAppt = todayAppts.find((a) => a.status !== "COMPLETED")

  const [walkInOpen, setWalkInOpen] = useState(false)

  if (loading) {
    return <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
  }

  return (
    <div>
      <SectionTitle title={`Bienvenido, ${barber?.name ?? "Barbero"}`} subtitle="Resumen de tu jornada" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Turnos restantes" value={todayAppts.length - cutsToday} icon={CalendarClock} />
        <StatCard label="Cortes realizados hoy" value={cutsToday} icon={Scissors} tone="primary" />
        <StatCard label="Generado hoy" value={money(genToday)} icon={Wallet} tone="positive" />
      </div>

      <Card className="mb-6">
        <h2 className="mb-4 font-serif text-lg font-semibold">Turnos de hoy</h2>
        {todayAppts.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Sin turnos. <Button variant="link" size="sm" onClick={() => setWalkInOpen(true)}>Registrar walk-in</Button>
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {todayAppts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-serif text-base font-semibold tabular-nums text-primary">{a.time}</span>
                  <div>
                    <p className="font-medium">{a.client?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{a.service?.name ?? "—"}</p>
                  </div>
                </div>
                <Badge className={STATUS_META[a.status].className}>{STATUS_META[a.status].label}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {nextAppt && (
        <Card className="border-primary/40">
          <h2 className="mb-2 font-serif text-lg font-semibold text-primary">Próximo turno</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{nextAppt.client?.name ?? "—"}</p>
              <p className="text-sm text-muted-foreground">{nextAppt.service?.name ?? "—"} · {nextAppt.time}</p>
            </div>
            <Button size="sm" onClick={() => onNavigate("agenda")}>Ir a agenda</Button>
          </div>
        </Card>
      )}

      <div className="mt-6">
        <Button variant="outline" onClick={() => setWalkInOpen(true)}>Registrar corte sin turno (Walk-in)</Button>
      </div>

      {walkInOpen && <WalkInCutModal barberId={user?.barberId ?? ""} clients={clients} services={services} barbers={barbers} onClose={() => setWalkInOpen(false)} onSuccess={() => { mutate("/api/appointments"); mutate("/api/clients") }} />}
    </div>
  )
}

function WalkInCutModal({
  barberId, clients, services, barbers, onClose, onSuccess,
}: {
  barberId: string; clients: Client[]; services: Service[]; barbers: Barber[]; onClose: () => void; onSuccess: () => void
}) {
  const [clientName, setClientName] = useState("")
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "")
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5))
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!clientName || !serviceId) return
    setSaving(true)
    try {
      const newClient = await withLoading(apiClient.post<{ id: string }>("/api/clients", { name: clientName }), { loading: "Registrando cliente...", success: "Cliente registrado" })
      await withLoading(apiClient.post("/api/appointments/walk-in", {
        clientId: newClient.id,
        barberId,
        serviceId,
        date: new Date().toISOString().slice(0, 10),
        time,
        paymentMethod: "EFECTIVO",
      }), { loading: "Registrando walk-in...", success: "Walk-in registrado" })
      onSuccess()
      onClose()
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo registrar el walk-in" })
    } finally { setSaving(false) }
  }

  return (
    <Modal open onClose={onClose} title="Registrar corte sin turno (Walk-in)">
      <div className="grid gap-4">
        <Field label="Nombre del cliente"><Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre" /></Field>
        <Field label="Servicio">
          <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {services.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </Select>
        </Field>
        <Field label="Horario"><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary [color-scheme:dark]" /></Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null} Registrar y pagar</Button>
        </div>
      </div>
    </Modal>
  )
}
