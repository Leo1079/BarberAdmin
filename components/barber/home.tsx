"use client"

import { CalendarClock, Loader2, Scissors, Wallet } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { StatCard } from "@/components/stat-card"
import { Badge, Button, Card, Field, Input, Modal, SectionTitle, Select } from "@/components/ui-kit"
import { apiClient } from "@/lib/api-client"
import { formatDate, money, STATUS_META } from "@/lib/helpers"
import { useAuth } from "@/lib/auth-context"
import type { Appointment, Barber, Client, Service } from "@/lib/types"
import Swal from "sweetalert2"

export function BarberHome({ onNavigate }: { onNavigate: (k: string) => void }) {
  const { user } = useAuth()
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

  const genMonth = appointments
    .filter((a) => a.barberId === user?.barberId && a.status === "COMPLETED" && a.date.slice(0, 7) === today.slice(0, 7))
    .reduce((s, a) => s + (services.find((x) => x.id === a.serviceId)?.price ?? 0), 0)

  const commissionToday = Math.round((genToday * pct) / 100)
  const commissionMonth = Math.round((genMonth * pct) / 100)

  const cli = (id: string) => clients.find((c) => c.id === id)
  const svc = (id: string) => services.find((s) => s.id === id)

  const [cutModalOpen, setCutModalOpen] = useState(false)

  if (loading) {
    return <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
  }

  return (
    <div>
      <SectionTitle title={`Hola, ${barber?.name ?? "Barbero"}`} subtitle={formatDate(today)} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Turnos hoy" value={todayAppts.length} icon={CalendarClock} tone="primary" />
        <StatCard label="Cortes finalizados" value={cutsToday} icon={Scissors} />
        <StatCard label="Comisión hoy" value={money(commissionToday)} icon={Wallet} tone="positive" />
        <StatCard label="Comisión mes" value={money(commissionMonth)} icon={Wallet} tone="positive" />
      </div>

      <Button className="mt-6 w-full" size="md" onClick={() => setCutModalOpen(true)}>
        <Scissors className="size-4" /> Generar corte
      </Button>

      <Card className="mt-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold">Tu agenda de hoy</h2>
          <Button variant="ghost" size="sm" onClick={() => onNavigate("agenda")}>
            Ver todo
          </Button>
        </div>
        {todayAppts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No tenés turnos asignados hoy.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {todayAppts.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-xl neu-raised p-3"
              >
                <span className="font-serif text-base font-semibold tabular-nums text-primary">{a.time}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{cli(a.clientId)?.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{svc(a.serviceId)?.name}</p>
                </div>
                <Badge className={STATUS_META[a.status].className}>{STATUS_META[a.status].label}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {cutModalOpen && <WalkInCutModal services={services} clients={clients} barberId={user?.barberId ?? ""} onClose={() => setCutModalOpen(false)} onSuccess={fetchData} />}
    </div>
  )
}

function WalkInCutModal({
  services,
  clients,
  barberId,
  onClose,
  onSuccess,
}: {
  services: Service[]
  clients: Client[]
  barberId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "")
  const [clientQuery, setClientQuery] = useState("")
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(
    () => clients.filter((c) => c.name.toLowerCase().includes(clientQuery.toLowerCase())),
    [clients, clientQuery],
  )

  function selectClient(id: string) {
    const c = clients.find((x) => x.id === id)
    if (!c) return
    setSelectedClientId(id)
    setClientQuery(c.name)
    setShowDropdown(false)
  }

  function handleClientChange(value: string) {
    setClientQuery(value)
    setSelectedClientId(null)
    setShowDropdown(value.length > 0)
  }

  const svc = services.find((s) => s.id === serviceId)

  async function submit() {
    if (!serviceId) return
    setSaving(true)
    try {
      const now = new Date()
      const hh = String(now.getHours()).padStart(2, "0")
      const mm = String(now.getMinutes()).padStart(2, "0")
      const date = now.toISOString().slice(0, 10)

      // Create client if not selected
      let clientId = selectedClientId
      if (!clientId && clientQuery.trim()) {
        const newClient = await apiClient.post<{ id: string }>("/api/clients", {
          name: clientQuery.trim(),
        })
        clientId = newClient.id
      }

      if (!clientId) {
        alert("Seleccioná o escribí un nombre de cliente")
        setSaving(false)
        return
      }

      await apiClient.post("/api/appointments/walk-in", {
        clientId,
        barberId,
        serviceId,
        date,
        time: `${hh}:${mm}`,
      })
      onSuccess()
      Swal.fire({
        icon: "success",
        title: "Corte registrado",
        text: `${svc?.name} para ${clientQuery.trim()} - $${svc?.price?.toLocaleString()}`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      })
      onClose()
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "Error al registrar corte",
        text: e?.message || "Intentalo de nuevo",
        confirmButtonColor: "#d33",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Generar corte">
      <div className="grid gap-4">
        <Field label="Servicio">
          <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {money(s.price)} · {s.durationMin} min
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Cliente">
          <div className="relative">
            <Input
              placeholder="Buscá o escribí un nombre..."
              value={clientQuery}
              onChange={(e) => handleClientChange(e.target.value)}
              onFocus={() => { if (clientQuery) setShowDropdown(true) }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            />
            {showDropdown && filtered.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-xl neu-raised p-1">
                  {filtered.map((c) => (
                    <li
                      key={c.id}
                      onMouseDown={() => selectClient(c.id)}
                      className="cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground transition-all duration-200 hover:neu-raised"
                    >
                    {c.name}
                    <span className="ml-2 text-xs text-muted-foreground">{c.phone}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {selectedClientId && (
            <p className="mt-1 text-xs text-success">Cliente registrado seleccionado</p>
          )}
          {!selectedClientId && clientQuery.trim() && (
            <p className="mt-1 text-xs text-muted-foreground">
              Se creará nuevo cliente: <strong>{clientQuery.trim()}</strong>
            </p>
          )}
        </Field>
        {svc && (
          <p className="rounded-xl neu-inset px-3 py-2 text-sm text-muted-foreground">
            {svc.name} · {money(svc.price)} · {svc.durationMin} min
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} disabled={saving || !serviceId || (!selectedClientId && !clientQuery.trim())}>
            {saving ? "Guardando..." : "Registrar corte"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
