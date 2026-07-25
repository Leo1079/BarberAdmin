"use client"

import { Calculator, CheckCircle2, HandCoins, Loader2, Plus, X } from "lucide-react"
import { useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { Badge, Button, Card, Field, Input, Modal, SectionTitle, Select } from "@/components/ui-kit"
import { formatDate, money } from "@/lib/helpers"
import { swrFetcher, SWR_CONFIG } from "@/lib/swr-fetcher"
import { apiClient } from "@/lib/api-client"
import { withLoading } from "@/lib/swal-action"
import type { Adjustment, AdvanceRequest, Barber, Payout } from "@/lib/types"

interface BarberPending {
  barberId: string
  barberName: string
  commissionPct: number
  totalGenerated: number
  commission: number
  advances: number
  discounts: number
  total: number
  pendingAppointments: number
}

export function AdminPayouts() {
  const [calcOpen, setCalcOpen] = useState(false)
  const [calcPreselected, setCalcPreselected] = useState("")
  const [adjOpen, setAdjOpen] = useState(false)

  const { data: barbers = [] } = useSWR<Barber[]>("/api/barbers", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const { data: adjustments = [] } = useSWR<Adjustment[]>("/api/commissions/adjustments", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const { data: payouts = [] } = useSWR<Payout[]>("/api/commissions/payouts", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const { data: advanceRequests = [] } = useSWR<AdvanceRequest[]>("/api/commissions/advance-requests", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const { data: pendingSummary = [], isLoading } = useSWR<BarberPending[]>("/api/commissions/pending-summary", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const loading = isLoading
  const [error, setError] = useState("")

  const { mutate } = useSWRConfig()

  const pending = advanceRequests.filter((r) => r.status === "pending")
  const unpaid = pendingSummary.filter((p) => p.pendingAppointments > 0 && p.total > 0)

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleApprove = async (id: string) => {
    setActionLoading(`approve-${id}`)
    try {
      await withLoading(apiClient.patch(`/api/commissions/advance-requests/${id}/status`, { status: "approved" }), { loading: "Aprobando solicitud...", success: "Solicitud aprobada" })
      mutate("/api/commissions/advance-requests")
      mutate("/api/commissions/adjustments")
      mutate("/api/commissions/pending-summary")
      mutate("/api/dashboard/owner")
      mutate("/api/cash/balance")
    } catch (err: any) {
      alert(err?.message || "Error al aprobar solicitud")
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    setActionLoading(`reject-${id}`)
    try {
      await withLoading(apiClient.patch(`/api/commissions/advance-requests/${id}/status`, { status: "rejected" }), { loading: "Rechazando solicitud...", success: "Solicitud rechazada" })
      mutate("/api/commissions/advance-requests")
      mutate("/api/dashboard/owner")
      mutate("/api/cash/balance")
    } catch (err: any) {
      alert(err?.message || "Error al rechazar solicitud")
    } finally {
      setActionLoading(null)
    }
  }

  async function quickLiquidate(barberId: string) {
    setActionLoading(`liquidate-${barberId}`)
    try {
      await withLoading(apiClient.post("/api/commissions/payouts", { barberId, dateFrom: "2000-01-01", dateTo: new Date().toISOString().slice(0, 10) }), { loading: "Liquidando pago...", success: "Liquidación completada" })
      mutate("/api/commissions/payouts")
      mutate("/api/commissions/pending-summary")
      mutate("/api/dashboard/owner")
      mutate("/api/cash/balance")
    } catch (err: any) {
      alert(err?.message || "Error al liquidar")
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <SectionTitle
        title="Liquidaciones"
        subtitle="Resumen de comisiones pendientes por barbero"
        action={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setAdjOpen(true)}>
              <Plus className="size-4" /> Adelanto / Descuento
            </Button>
            <Button size="sm" onClick={() => setCalcOpen(true)}>
              <Calculator className="size-4" /> Calcular liquidación
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {unpaid.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-4 font-serif text-lg font-semibold">Comisiones pendientes por barbero</h2>
          <div className="flex flex-col gap-3">
            {unpaid.map((p) => (
              <div
                key={p.barberId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-secondary/40 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{p.barberName}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.pendingAppointments} turno{p.pendingAppointments !== 1 ? "s" : ""} pendiente{p.pendingAppointments !== 1 ? "s" : ""}
                    {" · "}{money(p.totalGenerated)} generado · {p.commissionPct}% comisión
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">
                      {money(p.commission)} - {money(p.advances + p.discounts)}
                    </p>
                    <p className="font-semibold tabular-nums text-success">{money(p.total)}</p>
                  </div>
                  <Button size="sm" onClick={() => quickLiquidate(p.barberId)} disabled={actionLoading === `liquidate-${p.barberId}`}>
                    {actionLoading === `liquidate-${p.barberId}` ? <Loader2 className="size-3.5 animate-spin" /> : null}
                    {actionLoading === `liquidate-${p.barberId}` ? "Liquidando..." : `Liquidar $${money(p.total)}`}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {pending.length > 0 && (
        <Card className="mb-6 border-primary/30">
          <h2 className="mb-4 font-serif text-lg font-semibold text-primary">
            Solicitudes de adelanto pendientes ({pending.length})
          </h2>
          <div className="flex flex-col gap-3">
            {pending.map((r) => {
              const barber = barbers.find((b) => b.id === r.barberId)
              return (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-secondary/40 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{barber?.name ?? r.barber?.name ?? "Barbero"}</p>
                    <p className="text-xs text-muted-foreground">
                      {money(r.amount)} · {r.description || "Sin motivo"} · {formatDate(r.date)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="success" onClick={() => handleApprove(r.id)} disabled={actionLoading === `approve-${r.id}` || actionLoading === `reject-${r.id}`}>
                      {actionLoading === `approve-${r.id}` ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                      {actionLoading === `approve-${r.id}` ? "Aprobando..." : "Aprobar"}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleReject(r.id)} disabled={actionLoading === `approve-${r.id}` || actionLoading === `reject-${r.id}`}>
                      {actionLoading === `reject-${r.id}` ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                      {actionLoading === `reject-${r.id}` ? "Rechazando..." : "Rechazar"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {payouts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          Aún no se registraron liquidaciones.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <h2 className="font-serif text-lg font-semibold">Historial de liquidaciones</h2>
          {payouts.map((p) => {
            const b = barbers.find((x) => x.id === p.barberId)
            return (
              <Card key={p.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-3">
                <div>
                  <p className="font-medium">{b?.name ?? p.barber?.name ?? "Barbero"}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(p.date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="border-border text-muted-foreground">
                    {money(p.commission)} - {money(p.advances + p.discounts)}
                  </Badge>
                  <span className="font-semibold tabular-nums text-success">{money(p.total)}</span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {calcOpen && (
        <CalculatePayoutModal
          barbers={barbers}
          preselectedBarberId={calcPreselected}
          onClose={() => { setCalcOpen(false); setCalcPreselected("") }}
          onSuccess={() => { mutate("/api/commissions/payouts"); mutate("/api/commissions/pending-summary"); mutate("/api/dashboard/owner"); mutate("/api/cash/balance") }}
        />
      )}
      {adjOpen && <AdjustmentModal barbers={barbers} onClose={() => setAdjOpen(false)} onSuccess={() => { mutate("/api/commissions/adjustments"); mutate("/api/commissions/pending-summary"); mutate("/api/dashboard/owner"); mutate("/api/cash/balance") }} />}
    </div>
  )
}

function CalculatePayoutModal({
  barbers,
  preselectedBarberId,
  onClose,
  onSuccess,
}: {
  barbers: Barber[]
  preselectedBarberId?: string
  onClose: () => void
  onSuccess: () => void
}) {
  const initialId = preselectedBarberId && barbers.some((b) => b.id === preselectedBarberId)
    ? preselectedBarberId
    : barbers[0]?.id ?? ""
  const [barberId, setBarberId] = useState(initialId)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [result, setResult] = useState<{
    totalGenerated: number
    commission: number
    advances: number
    discounts: number
    total: number
    appointments: Array<{ time: string; service: string; amount: number }>
    adjustments: Array<{ type: string; amount: number; description: string }>
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function calculate() {
    if (!barberId || !dateFrom || !dateTo) return
    setSaving(true)
    setError("")
    setResult(null)
    try {
      const data = await withLoading(apiClient.post<any>("/api/commissions/payouts", { barberId, dateFrom, dateTo }), { loading: "Calculando liquidación...", success: "Liquidación calculada" })
      setResult({
        totalGenerated: data.totalGenerated,
        commission: data.commission,
        advances: data.advances,
        discounts: data.discounts,
        total: data.total,
        appointments: data.appointments ?? [],
        adjustments: data.adjustments ?? [],
      })
      onSuccess()
    } catch (err: any) {
      setError(err?.message || "No se encontraron turnos para liquidar en ese rango")
    } finally {
      setSaving(false)
    }
  }

  const barber = barbers.find((b) => b.id === barberId)

  return (
    <Modal open onClose={onClose} title="Calcular liquidación">
      <div className="grid gap-4">
        <Field label="Barbero">
          <Select value={barberId} onChange={(e) => { setBarberId(e.target.value); setResult(null); setError("") }}>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Desde">
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setResult(null) }} />
          </Field>
          <Field label="Hasta">
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setResult(null) }} />
          </Field>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {result && (
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <p className="mb-2 font-medium text-primary">{barber?.name} — {formatDate(dateFrom)} al {formatDate(dateTo)}</p>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Generado</span><span className="tabular-nums">{money(result.totalGenerated)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Comisión ({barber?.commissionPct ?? 0}%)</span><span className="tabular-nums text-primary">{money(result.commission)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Adelantos</span><span className="tabular-nums text-destructive">-{money(result.advances)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Descuentos</span><span className="tabular-nums text-destructive">-{money(result.discounts)}</span></div>
              <hr className="border-border" />
              <div className="flex justify-between font-semibold"><span>Total liquidado</span><span className="tabular-nums text-success">{money(result.total)}</span></div>
            </div>
            {result.appointments.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground uppercase">Turnos incluidos ({result.appointments.length})</p>
                {result.appointments.map((a, i) => (
                  <div key={i} className="flex justify-between text-xs text-muted-foreground">
                    <span>{a.time} — {a.service}</span>
                    <span className="tabular-nums">{money(a.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cerrar
          </Button>
          <Button onClick={calculate} disabled={saving || !barberId || !dateFrom || !dateTo}>
            {saving ? "Calculando..." : result ? "Recalcular" : "Calcular y liquidar"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function AdjustmentModal({
  barbers,
  onClose,
  onSuccess,
}: {
  barbers: Barber[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [barberId, setBarberId] = useState(barbers[0]?.id ?? "")
  const [type, setType] = useState<"advance" | "discount">("advance")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    const v = Number(amount)
    if (!v || !description) return
    setSaving(true)
    setError("")
    try {
      await withLoading(apiClient.post("/api/commissions/adjustments", {
        barberId,
        type,
        amount: v,
        description,
        date: new Date().toISOString().slice(0, 10),
      }), { loading: "Guardando...", success: "Ajuste registrado" })
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err?.message || "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Registrar adelanto o descuento">
      <div className="grid gap-4">
        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}
        <Field label="Barbero">
          <Select value={barberId} onChange={(e) => setBarberId(e.target.value)}>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo">
            <Select value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="advance">Adelanto</option>
              <option value="discount">Descuento</option>
            </Select>
          </Field>
          <Field label="Monto">
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
        </div>
        <Field label="Descripción">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Motivo" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
