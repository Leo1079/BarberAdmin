"use client"

import { HandCoins, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button, Card, Field, Input, SectionTitle } from "@/components/ui-kit"
import { apiClient } from "@/lib/api-client"
import { withLoading } from "@/lib/swal-action"
import { useAuth } from "@/lib/auth-context"

export function BarberAdvanceRequestForm() {
  const { user } = useAuth()
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const barberId = user?.barberId

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const v = Number(amount)
    if (!v || !barberId) return
    setSaving(true)
    setError("")
    setSuccess(false)
    try {
      await withLoading(apiClient.post("/api/commissions/advance-requests", {
        barberId,
        amount: v,
        description,
        date: new Date().toISOString().slice(0, 10),
      }), { loading: "Solicitando adelanto...", success: "Solicitud enviada" })
      setSuccess(true)
      setAmount("")
      setDescription("")
    } catch (err: any) {
      setError(err?.message || "Error al solicitar adelanto")
    } finally {
      setSaving(false)
    }
  }

  if (!barberId) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
        No se pudo identificar tu perfil de barbero.
      </div>
    )
  }

  return (
    <div>
      <SectionTitle title="Pedir adelanto" subtitle="Solicitá un adelanto de comisiones" />

      <Card className="max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-success/20 bg-success/10 p-3 text-xs text-success">
              Solicitud enviada. Esperá la aprobación del administrador.
            </div>
          )}

          <Field label="Monto">
            <Input
              type="number"
              required
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

          <Button type="submit" disabled={saving || !Number(amount)}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <HandCoins className="size-4" />}
            {saving ? "Enviando..." : "Solicitar adelanto"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
