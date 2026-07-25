"use client"

import { CheckCircle2, Key, Loader2, Pencil, Plus, Power, X } from "lucide-react"
import { useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { Badge, Button, Card, Field, Input, Modal, SectionTitle } from "@/components/ui-kit"
import { apiClient } from "@/lib/api-client"
import { formatDate, money } from "@/lib/helpers"
import { swrFetcher, SWR_CONFIG } from "@/lib/swr-fetcher"
import { withLoading } from "@/lib/swal-action"
import type { AdvanceRequest, Barber } from "@/lib/types"

type StaffTab = "staff" | "advances"

export function AdminStaff() {
  const [tab, setTab] = useState<StaffTab>("staff")
  const [editing, setEditing] = useState<Barber | null>(null)
  const [creating, setCreating] = useState(false)
  const [resettingPasswordBarber, setResettingPasswordBarber] = useState<Barber | null>(null)

  const { data: barbers = [], isLoading } = useSWR<Barber[]>("/api/barbers", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const loading = isLoading
  const [error, setError] = useState("")
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const { mutate } = useSWRConfig()

  const handleToggleActive = async (b: Barber) => {
    setTogglingId(b.id)
    try {
      await withLoading(apiClient.patch(`/api/barbers/${b.id}/toggle-active`), { loading: "Cambiando estado...", success: "Estado actualizado" })
      mutate("/api/barbers")
    } catch (err: any) {
      alert(err?.message || "Error al cambiar estado del barbero")
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div>
      <SectionTitle
        title="Peluqueros"
        subtitle="Gestión del staff y rendimiento"
        action={
          tab === "staff" ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="size-4" /> Nuevo peluquero
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 flex gap-1 rounded-xl bg-secondary/60 p-1">
        <button
          onClick={() => setTab("staff")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "staff" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Staff
        </button>
        <button
          onClick={() => setTab("advances")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "advances" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Solicitudes de adelanto
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {tab === "staff" && (
        <>
          {loading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {barbers.map((b) => (
                <Card key={b.id} className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={b.photo || "/placeholder-user.jpg"}
                      alt={b.name}
                      className="size-14 rounded-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-user.jpg" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{b.name}</p>
                      <Badge
                        className={
                          b.active
                            ? "border-success/30 bg-success/15 text-success"
                            : "border-border text-muted-foreground"
                        }
                      >
                        {b.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-secondary/40 p-3 text-center">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Comisión</p>
                      <p className="text-sm font-semibold text-primary">{b.commissionPct}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Horario</p>
                      <p className="text-sm font-semibold">{b.workStart} - {b.workEnd}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditing(b)}>
                      <Pencil className="size-3.5" /> Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setResettingPasswordBarber(b)}
                      title="Resetear contraseña"
                    >
                      <Key className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(b)}
                      disabled={togglingId === b.id}
                      title={b.active ? "Desactivar" : "Activar"}
                    >
                      {togglingId === b.id ? <Loader2 className="size-4 animate-spin" /> : <Power className={`size-4 ${b.active ? "text-destructive" : "text-success"}`} />}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {(creating || editing) && (
            <BarberModal
              barber={editing}
              onClose={() => { setEditing(null); setCreating(false) }}
              onSuccess={() => mutate("/api/barbers")}
            />
          )}

          {resettingPasswordBarber && (
            <ResetPasswordModal
              barber={resettingPasswordBarber}
              onClose={() => setResettingPasswordBarber(null)}
            />
          )}
        </>
      )}

      {tab === "advances" && <AdvanceRequestsSection />}
    </div>
  )
}

function AdvanceRequestsSection() {
  const { data: requests = [], isLoading } = useSWR<AdvanceRequest[]>("/api/commissions/advance-requests", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const { data: barbers = [] } = useSWR<Barber[]>("/api/barbers", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const loading = isLoading
  const [error, setError] = useState("")

  const { mutate } = useSWRConfig()

  const handleApprove = async (id: string) => {
    try {
      await withLoading(apiClient.patch(`/api/commissions/advance-requests/${id}/status`, { status: "approved" }), { loading: "Aprobando solicitud...", success: "Solicitud aprobada" })
      mutate("/api/commissions/advance-requests")
    } catch (err: any) {
      alert(err?.message || "Error al aprobar solicitud")
    }
  }

  const handleReject = async (id: string) => {
    try {
      await withLoading(apiClient.patch(`/api/commissions/advance-requests/${id}/status`, { status: "rejected" }), { loading: "Rechazando solicitud...", success: "Solicitud rechazada" })
      mutate("/api/commissions/advance-requests")
    } catch (err: any) {
      alert(err?.message || "Error al rechazar solicitud")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  const grouped = {
    pending: requests.filter((r) => r.status === "pending"),
    approved: requests.filter((r) => r.status === "approved"),
    rejected: requests.filter((r) => r.status === "rejected"),
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          No hay solicitudes de adelanto.
        </p>
      ) : (
        <>
          {grouped.pending.length > 0 && (
            <Card className="mb-6 border-primary/30">
              <h2 className="mb-4 font-serif text-lg font-semibold text-primary">
                Pendientes ({grouped.pending.length})
              </h2>
              <div className="flex flex-col gap-3">
                {grouped.pending.map((r) => {
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
                        <Button size="sm" variant="success" onClick={() => handleApprove(r.id)}>
                          <CheckCircle2 className="size-3.5" /> Aprobar
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleReject(r.id)}>
                          <X className="size-3.5" /> Rechazar
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {grouped.approved.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Aprobadas ({grouped.approved.length})</h3>
              <div className="flex flex-col gap-2">
                {grouped.approved.map((r) => {
                  const barber = barbers.find((b) => b.id === r.barberId)
                  return (
                    <div key={r.id} className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-2 text-sm">
                      <div>
                        <p className="font-medium">{barber?.name ?? r.barber?.name ?? "Barbero"}</p>
                        <p className="text-xs text-muted-foreground">{money(r.amount)} · {r.description || "Sin motivo"}</p>
                      </div>
                      <Badge className="border-success/30 bg-success/15 text-success">Aprobado</Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {grouped.rejected.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Rechazadas ({grouped.rejected.length})</h3>
              <div className="flex flex-col gap-2">
                {grouped.rejected.map((r) => {
                  const barber = barbers.find((b) => b.id === r.barberId)
                  return (
                    <div key={r.id} className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-2 text-sm">
                      <div>
                        <p className="font-medium">{barber?.name ?? r.barber?.name ?? "Barbero"}</p>
                        <p className="text-xs text-muted-foreground">{money(r.amount)} · {r.description || "Sin motivo"}</p>
                      </div>
                      <Badge className="border-destructive/30 bg-destructive/15 text-destructive">Rechazado</Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function BarberModal({
  barber,
  onClose,
  onSuccess,
}: {
  barber: Barber | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState(barber?.name ?? "")
  const [email, setEmail] = useState(barber?.user?.email ?? "")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState(barber?.phone ?? "")
  const [address, setAddress] = useState(barber?.address ?? "")
  const [commissionPct, setCommissionPct] = useState(String(barber?.commissionPct ?? 45))
  const [workStart, setWorkStart] = useState(barber?.workStart ?? "09:00")
  const [workEnd, setWorkEnd] = useState(barber?.workEnd ?? "20:00")
  const [photo, setPhoto] = useState(barber?.photo ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    if (!name) return
    if (!email) {
      setError("El email es requerido")
      return
    }
    if (!barber?.id && !password) {
      setError("La contraseña es requerida")
      return
    }
    setSaving(true)
    setError("")
    try {
      const payload: any = { name, email, phone, address, photo: photo.trim(), commissionPct: Number(commissionPct), workStart, workEnd }
      if (!barber?.id) { payload.password = password }
      if (barber?.id) {
        await withLoading(apiClient.patch(`/api/barbers/${barber.id}`, payload), { loading: "Guardando cambios...", success: "Barbero actualizado" })
      } else {
        await withLoading(apiClient.post("/api/barbers", payload), { loading: "Creando barbero...", success: "Barbero creado" })
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err?.message || "Error al guardar barbero")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={barber ? "Editar peluquero" : "Nuevo peluquero"}>
      <div className="grid gap-4">
        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}
        <Field label="Nombre">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@ejemplo.com" />
        </Field>
        {!barber && (
          <Field label="Contraseña">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Teléfono"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Número de teléfono" /></Field>
          <Field label="Dirección"><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección física" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="% Comisión"><Input type="number" value={commissionPct} onChange={(e) => setCommissionPct(e.target.value)} /></Field>
          <Field label="Foto URL"><Input value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="https://ejemplo.com/foto.jpg" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Entrada">
            <input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary [color-scheme:dark]" />
          </Field>
          <Field label="Salida">
            <input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary [color-scheme:dark]" />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
        </div>
      </div>
    </Modal>
  )
}

function ResetPasswordModal({ barber, onClose }: { barber: Barber | null; onClose: () => void }) {
  const [newPassword, setNewPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  if (!barber) return null

  async function submit() {
    if (newPassword.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return }
    setSaving(true); setError("")
    try {
      await withLoading(apiClient.patch(`/api/barbers/${barber?.id}/reset-password`, { newPassword }), { loading: "Reseteando contraseña...", success: "Contraseña reseteada" })
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || "Error al resetear contraseña")
    } finally { setSaving(false) }
  }

  return (
    <Modal open onClose={onClose} title="Resetear contraseña">
      {success ? (
        <div className="grid gap-4 py-4 text-center">
          <p className="text-sm text-foreground">¡La contraseña de <strong>{barber?.name}</strong> ha sido reseteada con éxito!</p>
          <Button onClick={onClose} className="mx-auto w-32">Aceptar</Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {error && <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
          <p className="text-sm text-muted-foreground">Ingresa la nueva contraseña para <strong>{barber?.name}</strong>:</p>
          <Field label="Nueva contraseña"><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres" /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button onClick={submit} disabled={saving}>{saving ? "Guardando..." : "Confirmar"}</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
