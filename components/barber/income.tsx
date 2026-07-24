"use client"

import { HandCoins, Loader2, Minus, Percent, TrendingUp, Wallet } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { StatCard } from "@/components/stat-card"
import { Badge, Button, Card, Field, Input, Modal, SectionTitle } from "@/components/ui-kit"
import { apiClient } from "@/lib/api-client"
import { money } from "@/lib/helpers"
import { useAuth } from "@/lib/auth-context"
import type { Adjustment, AdvanceRequest, Appointment, Service } from "@/lib/types"

export function BarberIncome() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<{ id: string; commissionPct: number }[]>([])
  const [adjustments, setAdjustments] = useState<Adjustment[]>([])
  const [advanceRequests, setAdvanceRequests] = useState<AdvanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [advModal, setAdvModal] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [appts, svcs, brbs, adjs, reqs] = await Promise.all([
        apiClient.get<Appointment[]>("/api/appointments"),
        apiClient.get<Service[]>("/api/services"),
        apiClient.get<{ id: string; commissionPct: number }[]>("/api/barbers"),
        apiClient.get<Adjustment[]>("/api/commissions/adjustments"),
        apiClient.get<AdvanceRequest[]>("/api/commissions/advance-requests"),
      ])
      setAppointments(appts)
      setServices(svcs)
      setBarbers(brbs)
      setAdjustments(adjs)
      setAdvanceRequests(reqs)
    } catch {
      // silence
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const barberId = user?.barberId
  const barber = barbers.find((b) => b.id === barberId)
  const pct = barber?.commissionPct ?? 0

  const generated = appointments
    .filter((a) => a.barberId === barberId && a.status === "COMPLETED")
    .reduce((s, a) => s + (services.find((x) => x.id === a.serviceId)?.price ?? 0), 0)

  const myAdjustments = adjustments.filter((a) => a.barberId === barberId)
  const myRequests = advanceRequests.filter((r) => r.barberId === barberId)

  const advances = myAdjustments
    .filter((a) => a.type === "advance")
    .reduce((s, a) => s + a.amount, 0)
  const discounts = myAdjustments
    .filter((a) => a.type === "discount")
    .reduce((s, a) => s + a.amount, 0)

  const commission = Math.round((generated * pct) / 100)

  if (loading) {
    return <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
  }

  const net = commission - advances - discounts

  const rows = [
    { label: "Total generado para la barbería", value: money(generated), sign: "" },
    { label: `Comisión (${pct}%)`, value: money(commission), sign: "+", tone: "text-primary" },
    { label: "Adelantos recibidos", value: money(advances), sign: "-", tone: "text-destructive" },
    { label: "Descuentos aplicados", value: money(discounts), sign: "-", tone: "text-destructive" },
  ]

  return (
    <div>
      <SectionTitle title="Mis Ingresos" subtitle="Detalle transparente de tus números" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Generado" value={money(generated)} icon={TrendingUp} />
        <StatCard label="Comisión" value={money(commission)} icon={Percent} tone="primary" />
        <StatCard label="Deducciones" value={money(advances + discounts)} icon={Minus} tone="negative" />
        <StatCard label="Neto a cobrar" value={money(net)} icon={Wallet} tone="positive" />
      </div>

      <Card className="mt-4">
        <h2 className="mb-4 font-serif text-lg font-semibold">Desglose</h2>
        <div className="flex flex-col divide-y divide-border">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between py-3 text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className={"font-medium tabular-nums " + (r.tone ?? "")}>
                {r.sign}
                {r.value}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between py-3">
            <span className="font-medium">Total neto</span>
            <span className="font-serif text-xl font-semibold tabular-nums text-success">{money(net)}</span>
          </div>
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="mb-4 font-serif text-lg font-semibold">Adelantos y descuentos</h2>
        {myAdjustments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin movimientos.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {myAdjustments.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium">{a.type === "advance" ? "Adelanto" : "Descuento"}</span>
                  {a.description && <span className="text-muted-foreground"> · {a.description}</span>}
                </div>
                <span className="font-medium text-destructive tabular-nums">-{money(a.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold">Solicitudes de adelanto</h2>
          <Button size="sm" onClick={() => setAdvModal(true)}>
            <HandCoins className="size-4" /> Pedir adelanto
          </Button>
        </div>
        {myRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hiciste solicitudes todavía.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {myRequests.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{money(r.amount)}</p>
                  {r.description && (
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  )}
                </div>
                <Badge className={r.status === "approved" ? "border-success/30 bg-success/15 text-success" : r.status === "rejected" ? "border-destructive/30 bg-destructive/15 text-destructive" : "bg-warning/15 text-warning border-warning/30"}>
                  {r.status === "approved" ? "Aprobado" : r.status === "rejected" ? "Rechazado" : "Pendiente"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {advModal && (
        <AdvanceRequestModal barberId={barberId ?? ""} onClose={() => setAdvModal(false)} onSuccess={fetchData} />
      )}
    </div>
  )
}

function AdvanceRequestModal({
  barberId,
  onClose,
  onSuccess,
}: {
  barberId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)

  async function submit() {
    const v = Number(amount)
    if (!v) return
    setSaving(true)
    try {
      await apiClient.post("/api/commissions/advance-requests", {
        barberId,
        amount: v,
        description,
        date: new Date().toISOString().slice(0, 10),
      })
      onSuccess()
      onClose()
    } catch {
      alert("Error al solicitar adelanto")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Pedir adelanto">
      <div className="grid gap-4">
        <Field label="Monto">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Motivo">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: adelanto de semana"
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} disabled={saving || !Number(amount)}>
            {saving ? "Enviando..." : "Solicitar"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
