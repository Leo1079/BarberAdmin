"use client"

import { Clock, Pencil, Plus, Scissors, Power, Loader2 } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { Button, Card, Field, Input, Modal, SectionTitle } from "@/components/ui-kit"
import { money } from "@/lib/helpers"
import { apiClient } from "@/lib/api-client"
import type { Service } from "@/lib/types"

export function AdminServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState<Service | null>(null)
  const [creating, setCreating] = useState(false)

  const fetchServices = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiClient.get<Service[]>("/api/services")
      setServices(data)
    } catch (err: any) {
      setError(err?.message || "Error al cargar los servicios")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleToggleActive = async (service: Service) => {
    setTogglingId(service.id)
    try {
      await apiClient.patch(`/api/services/${service.id}/toggle-active`)
      fetchServices()
    } catch (err: any) {
      alert(err?.message || "Error al cambiar estado del servicio")
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div>
      <SectionTitle
        title="Servicios"
        subtitle="Catálogo de servicios de la barbería"
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
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Scissors className="size-5" />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing(s)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    aria-label="Editar"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(s)}
                    disabled={togglingId === s.id}
                    className={`rounded-md p-1.5 ${
                      s.active !== false ? "text-success hover:bg-success/15" : "text-muted-foreground hover:bg-secondary"
                    } disabled:opacity-50`}
                    title={s.active !== false ? "Desactivar" : "Activar"}
                  >
                    {togglingId === s.id ? <Loader2 className="size-4 animate-spin" /> : <Power className="size-4" />}
                  </button>
                </div>
              </div>
              <div>
                <p className="font-medium">{s.name}</p>
                <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" /> {s.durationMin} min
                  </span>
                </div>
              </div>
              <p className="font-serif text-xl font-semibold text-primary">{money(s.price)}</p>
            </Card>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <ServiceModal
          service={editing}
          onClose={() => {
            setEditing(null)
            setCreating(false)
          }}
          onSuccess={fetchServices}
        />
      )}
    </div>
  )
}

function ServiceModal({
  service,
  onClose,
  onSuccess,
}: {
  service: Service | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState(service?.name ?? "")
  const [price, setPrice] = useState(String(service?.price ?? ""))
  const [durationMin, setDurationMin] = useState(String(service?.durationMin ?? 30))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    if (!name || !price) return
    setSaving(true)
    setError("")
    try {
      const payload = {
        name,
        price: Number(price),
        durationMin: Number(durationMin),
      }
      if (service?.id) {
        await apiClient.patch(`/api/services/${service.id}`, payload)
      } else {
        await apiClient.post("/api/services", payload)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err?.message || "Error al guardar servicio")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={service ? "Editar servicio" : "Nuevo servicio"}>
      <div className="grid gap-4">
        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}
        <Field label="Nombre">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Corte Fade" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Precio">
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
          </Field>
          <Field label="Duración (min)">
            <Input
              type="number"
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              step={15}
            />
          </Field>
        </div>
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
