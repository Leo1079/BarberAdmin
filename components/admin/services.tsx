"use client"

import { Loader2, Pencil, Plus, Power } from "lucide-react"
import { useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { Badge, Button, Card, Field, Input, Modal, SectionTitle } from "@/components/ui-kit"
import { money } from "@/lib/helpers"
import { swrFetcher, SWR_CONFIG } from "@/lib/swr-fetcher"
import { apiClient } from "@/lib/api-client"
import { withLoading } from "@/lib/swal-action"
import type { Service } from "@/lib/types"

export function AdminServices() {
  const { data: services = [], isLoading } = useSWR<Service[]>(
    "/api/services",
    swrFetcher,
    { ...SWR_CONFIG, fallbackData: [] },
  )
  const loading = isLoading
  const [error, setError] = useState("")
  const [editing, setEditing] = useState<Service | null>(null)
  const [creating, setCreating] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const { mutate } = useSWRConfig()

  const handleToggleActive = async (service: Service) => {
    setTogglingId(service.id)
    try {
      await withLoading(apiClient.patch(`/api/services/${service.id}/toggle-active`), { loading: "Cambiando estado...", success: "Estado actualizado" })
      mutate("/api/services")
    } catch (err: any) {
      alert(err?.message || "Error al cambiar estado")
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div>
      <SectionTitle
        title="Servicios"
        subtitle="Gestioná los servicios que ofrecen los barberos"
        action={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Nuevo servicio
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : services.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No hay servicios registrados.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {services.map((s) => (
            <Card key={s.id} className="flex items-center gap-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.durationMin} min</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold tabular-nums text-primary">{money(s.price)}</span>
                <Badge className={s.active ? "bg-success/15 text-success border-success/30" : "bg-destructive/15 text-destructive border-destructive/30"}>
                  {s.active ? "Activo" : "Inactivo"}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setEditing(s)} aria-label="Editar">
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleToggleActive(s)} disabled={togglingId === s.id} aria-label="Toggle active">
                  {togglingId === s.id ? <Loader2 className="size-4 animate-spin" /> : <Power className={`size-4 ${s.active ? "text-destructive" : "text-success"}`} />}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {creating && <ServiceForm onClose={() => setCreating(false)} onSuccess={() => mutate("/api/services")} />}
      {editing && <ServiceForm service={editing} onClose={() => setEditing(null)} onSuccess={() => mutate("/api/services")} />}
    </div>
  )
}

function ServiceForm({ service, onClose, onSuccess }: { service?: Service; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(service?.name ?? "")
  const [price, setPrice] = useState(String(service?.price ?? ""))
  const [durationMin, setDurationMin] = useState(String(service?.durationMin ?? ""))
  const [description, setDescription] = useState(service?.description ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    const p = Number(price)
    const d = Number(durationMin)
    if (!name || !p || !d) { setError("Completá todos los campos"); return }
    setSaving(true)
    setError("")
    try {
      if (service) {
        await withLoading(apiClient.patch(`/api/services/${service.id}`, { name, price: p, durationMin: d, description }), { loading: "Guardando cambios...", success: "Servicio actualizado" })
      } else {
        await withLoading(apiClient.post("/api/services", { name, price: p, durationMin: d, description }), { loading: "Creando servicio...", success: "Servicio creado" })
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err?.message ?? "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={service ? "Editar servicio" : "Nuevo servicio"}>
      <div className="grid gap-4">
        <Field label="Nombre">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Corte Clásico" />
        </Field>
        <Field label="Precio ($)">
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
        </Field>
        <Field label="Duración (min)">
          <Input type="number" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} placeholder="30" />
        </Field>
        <Field label="Descripción">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" />
        </Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null} Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}
