"use client"

import { ChevronDown, ChevronRight, Loader2, Pencil, Plus, Power } from "lucide-react"
import { useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { Badge, Button, Card, Field, Input, Modal, SectionTitle } from "@/components/ui-kit"
import { formatDate, money } from "@/lib/helpers"
import { swrFetcher, SWR_CONFIG } from "@/lib/swr-fetcher"
import { apiClient } from "@/lib/api-client"
import { withLoading } from "@/lib/swal-action"
import type { Appointment, Client } from "@/lib/types"

export function AdminClients() {
  const { data: clients = [], isLoading } = useSWR<Client[]>(
    "/api/clients",
    swrFetcher,
    { ...SWR_CONFIG, fallbackData: [] },
  )
  const loading = isLoading
  const [error, setError] = useState("")
  const [editing, setEditing] = useState<Client | null>(null)
  const [creating, setCreating] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const { mutate } = useSWRConfig()

  const { data: history = [], isLoading: historyLoading } = useSWR<Appointment[]>(
    expandedId ? `/api/appointments?clientId=${expandedId}` : null,
    swrFetcher,
    { ...SWR_CONFIG, fallbackData: [] },
  )

  const handleToggleActive = async (c: Client) => {
    setTogglingId(c.id)
    try {
      await withLoading(apiClient.patch(`/api/clients/${c.id}/toggle-active`), { loading: "Cambiando estado...", success: "Estado actualizado" })
      mutate("/api/clients")
    } catch (err: any) {
      alert(err?.message || "Error al cambiar estado")
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div>
      <SectionTitle
        title="Clientes"
        subtitle="Gestión de clientes registrados"
        action={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Nuevo cliente
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
      ) : clients.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No hay clientes registrados.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {clients.map((c) => (
            <div key={c.id}>
              <Card className="flex items-center gap-3 py-3">
                <Button variant="ghost" size="sm" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)} aria-label="Ver historial">
                  {expandedId === c.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </Button>
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.phone || "—"}</p>
                </div>
                <Badge className={c.active !== false ? "bg-success/15 text-success border-success/30" : "bg-destructive/15 text-destructive border-destructive/30"}>
                  {c.active !== false ? "Activo" : "Inactivo"}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setEditing(c)} aria-label="Editar">
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleToggleActive(c)} disabled={togglingId === c.id} aria-label="Toggle active">
                  {togglingId === c.id ? <Loader2 className="size-4 animate-spin" /> : <Power className={`size-4 ${c.active !== false ? "text-destructive" : "text-success"}`} />}
                </Button>
              </Card>
              {expandedId === c.id && (
                <Card className="mt-1 border-t-0 rounded-t-none">
                  {historyLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>
                  ) : history.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">Sin historial de turnos</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {history.map((a) => (
                        <div key={a.id} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 text-sm">
                          <span>{formatDate(a.date)} · {a.time}</span>
                          <span>{a.service?.name ?? "—"}</span>
                          <Badge className="border-border text-muted-foreground">{a.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}
            </div>
          ))}
        </div>
      )}

      {creating && <ClientForm onClose={() => setCreating(false)} onSuccess={() => mutate("/api/clients")} />}
      {editing && <ClientForm client={editing} onClose={() => setEditing(null)} onSuccess={() => mutate("/api/clients")} />}
    </div>
  )
}

function ClientForm({ client, onClose, onSuccess }: { client?: Client; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(client?.name ?? "")
  const [phone, setPhone] = useState(client?.phone ?? "")
  const [email, setEmail] = useState(client?.email ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    if (!name) { setError("El nombre es obligatorio"); return }
    setSaving(true)
    setError("")
    try {
      if (client) {
        await withLoading(apiClient.patch(`/api/clients/${client.id}`, { name, phone, email }), { loading: "Guardando cambios...", success: "Cliente actualizado" })
      } else {
        await withLoading(apiClient.post("/api/clients", { name, phone, email }), { loading: "Creando cliente...", success: "Cliente creado" })
      }
      onSuccess()
    } catch (err: any) {
      setError(err?.message || "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={client ? "Editar cliente" : "Nuevo cliente"}>
      <div className="grid gap-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Field label="Nombre">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del cliente" />
        </Field>
        <Field label="Teléfono">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 11 1234-5678" />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@mail.com" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {client ? "Guardar cambios" : "Crear cliente"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
