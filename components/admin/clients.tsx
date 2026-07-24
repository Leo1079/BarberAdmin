"use client"

import { ChevronDown, Mail, Phone, Plus, Search, Trash2, Loader2, Pencil } from "lucide-react"
import { useEffect, useMemo, useState, useCallback } from "react"
import { Button, Card, Field, Input, Modal, SectionTitle } from "@/components/ui-kit"
import { formatDate } from "@/lib/helpers"
import { apiClient } from "@/lib/api-client"
import type { Appointment, Client } from "@/lib/types"

export function AdminClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [clientAppts, setClientAppts] = useState<Record<string, Appointment[]>>({})
  const [loadingAppts, setLoadingAppts] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiClient.get<Client[]>("/api/clients")
      setClients(data)
    } catch (err: any) {
      setError(err?.message || "Error al cargar los clientes")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const filtered = useMemo(
    () =>
      clients.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.phone.includes(query) ||
          c.email.toLowerCase().includes(query.toLowerCase()),
      ),
    [clients, query],
  )

  async function loadHistory(clientId: string) {
    if (clientAppts[clientId]) return
    setLoadingAppts(clientId)
    try {
      const data = await apiClient.get<Appointment[]>(`/api/appointments?clientId=${clientId}`)
      setClientAppts((prev) => ({ ...prev, [clientId]: data }))
    } catch {
      setClientAppts((prev) => ({ ...prev, [clientId]: [] }))
    } finally {
      setLoadingAppts(null)
    }
  }

  async function handleToggleActive(c: Client) {
    if (!confirm(`¿Cambiar estado de ${c.name}?`)) return
    try {
      await apiClient.patch(`/api/clients/${c.id}/toggle-active`)
      fetchClients()
    } catch (err: any) {
      alert(err?.message || "Error al modificar el cliente")
    }
  }

  return (
    <div>
      <SectionTitle
        title="Clientes"
        subtitle={`${clients.length} clientes registrados`}
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

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email..."
          className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((c) => {
            const history = clientAppts[c.id] ?? []
            const expanded = open === c.id
            return (
              <Card key={c.id} className="p-0 overflow-hidden">
                <div className="flex w-full items-center gap-3 p-4 text-left flex-wrap sm:flex-nowrap">
                  <button
                    onClick={() => {
                      const next = expanded ? null : c.id
                      setOpen(next)
                      if (next) loadHistory(c.id)
                    }}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full neu-raised-sm font-medium text-primary">
                      {c.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.name}</p>
                      <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="size-3" /> {c.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="size-3" /> {c.email}
                        </span>
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 ml-auto shrink-0">
                    <button
                      onClick={() => setEditing(c)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      title="Editar"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <span className="text-xs text-muted-foreground">{history.length} visitas</span>
                    <button onClick={() => {
                      const next = expanded ? null : c.id
                      setOpen(next)
                      if (next) loadHistory(c.id)
                    }}>
                      <ChevronDown
                        className={"size-4 text-muted-foreground transition-transform " + (expanded ? "rotate-180" : "")}
                      />
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-medium">Historial de visitas</h3>
                      <button
                        onClick={() => handleToggleActive(c)}
                        className="flex items-center gap-1 text-xs text-destructive hover:underline"
                      >
                        <Trash2 className="size-3.5" /> Desactivar cliente
                      </button>
                    </div>
                    {loadingAppts === c.id ? (
                      <div className="flex justify-center py-4 text-muted-foreground">
                        <Loader2 className="size-5 animate-spin" />
                      </div>
                    ) : history.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin visitas registradas.</p>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {history.map((a) => (
                          <li
                            key={a.id}
                            className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2 text-sm"
                          >
                            <span>{a.service?.name ?? "—"}</span>
                            <span className="text-xs text-muted-foreground">
                              {a.barber?.name ?? "—"} · {formatDate(a.date)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {(creating || editing) && (
        <ClientModal
          client={editing}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSuccess={fetchClients}
        />
      )}
    </div>
  )
}

function ClientModal({
  onClose,
  onSuccess,
  client,
}: {
  onClose: () => void
  onSuccess: () => void
  client?: Client | null
}) {
  const [name, setName] = useState(client?.name ?? "")
  const [phone, setPhone] = useState(client?.phone ?? "")
  const [email, setEmail] = useState(client?.email ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    if (!name) return
    setSaving(true)
    setError("")
    try {
      const payload = { name, phone, email }
      if (client?.id) {
        await apiClient.patch(`/api/clients/${client.id}`, payload)
      } else {
        await apiClient.post("/api/clients", payload)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err?.message || "Error al guardar cliente")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={client ? "Editar cliente" : "Nuevo cliente"}>
      <div className="grid gap-4">
        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}
        <Field label="Nombre">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" />
        </Field>
        <Field label="Teléfono">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 ..." />
        </Field>
        <Field label="Email">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@ejemplo.com" />
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
