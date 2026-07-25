"use client"

import { ArrowDownRight, ArrowUpRight, Loader2, Plus, Trash2 } from "lucide-react"
import { useCallback, useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { StatCard } from "@/components/stat-card"
import { Badge, Button, Card, Field, Input, Modal, SectionTitle, Select } from "@/components/ui-kit"
import { formatDate, money } from "@/lib/helpers"
import { todayStr } from "@/lib/helpers"
import { swrFetcher, SWR_CONFIG } from "@/lib/swr-fetcher"
import { apiClient } from "@/lib/api-client"
import { withLoading } from "@/lib/swal-action"
import type { CashMovement, MovementType } from "@/lib/types"

const INCOME_CATS = ["Servicio", "Venta de productos", "Propina", "Otro"]
const EXPENSE_CATS = ["Insumos", "Alquiler", "Sueldos", "Liquidación", "Servicios", "Otro"]

interface CashSummary {
  totalIncome: number
  totalExpense: number
  movements: CashMovement[]
}

export function AdminCash() {
  const [showForm, setShowForm] = useState(false)

  const { data: summary, isLoading } = useSWR<CashSummary>(
    "/api/cash/balance",
    swrFetcher,
    { ...SWR_CONFIG, fallbackData: { totalIncome: 0, totalExpense: 0, movements: [] } },
  )
  const loading = isLoading

  const { mutate } = useSWRConfig()

  const handleDelete = useCallback(async (id: string) => {
    try {
      await withLoading(apiClient.delete(`/api/cash/${id}`), { loading: "Eliminando movimiento...", success: "Movimiento eliminado" })
      mutate("/api/cash/balance")
      mutate("/api/dashboard/owner")
    } catch {
      // silent
    }
  }, [mutate])

  return (
    <div>
      <SectionTitle
        title="Caja"
        subtitle="Ingresos y egresos del negocio"
        action={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="size-4" /> Nuevo movimiento
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Ingresos" value={money(summary.totalIncome)} icon={ArrowUpRight} tone="positive" />
        <StatCard label="Gastos" value={money(summary.totalExpense)} icon={ArrowDownRight} tone="negative" />
        <StatCard
          label="Balance"
          value={money(summary.totalIncome - summary.totalExpense)}
          icon={ArrowUpRight}
          tone={summary.totalIncome - summary.totalExpense >= 0 ? "positive" : "negative"}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : summary.movements.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No hay movimientos registrados.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {summary.movements.map((m) => (
            <Card key={m.id} className="flex items-center gap-3 py-3">
              <div className={`flex size-8 items-center justify-center rounded-lg ${m.type === "income" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                {m.type === "income" ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.description}</p>
                <p className="text-xs text-muted-foreground">{formatDate(m.date)} · <Badge className="border-border text-muted-foreground text-[10px]">{m.category}</Badge></p>
              </div>
              <span className={`shrink-0 text-sm font-semibold tabular-nums ${m.type === "income" ? "text-success" : "text-destructive"}`}>
                {m.type === "income" ? "+" : "-"} {money(m.amount)}
              </span>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)} aria-label="Eliminar movimiento">
                <Trash2 className="size-4 text-destructive/70" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {showForm && <CashForm onClose={() => setShowForm(false)} onSuccess={() => { mutate("/api/cash/balance"); mutate("/api/dashboard/owner") }} />}
    </div>
  )
}

function CashForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [type, setType] = useState<MovementType>("income")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState(INCOME_CATS[0])
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(todayStr())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    const num = Number(amount)
    if (!num || num <= 0) { setError("Monto inválido"); return }
    setSaving(true)
    setError("")
    try {
      await withLoading(apiClient.post("/api/cash", { type, amount: num, description, category, date }), { loading: "Guardando movimiento...", success: "Movimiento guardado" })
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err?.message ?? "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Nuevo movimiento">
      <div className="grid gap-4">
        <Field label="Tipo">
          <Select value={type} onChange={(e) => { setType(e.target.value as MovementType); setCategory(e.target.value === "income" ? INCOME_CATS[0] : EXPENSE_CATS[0]) }}>
            <option value="income">Ingreso</option>
            <option value="expense">Gasto</option>
          </Select>
        </Field>
        <Field label="Categoría">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {(type === "income" ? INCOME_CATS : EXPENSE_CATS).map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Monto ($)">
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
        </Field>
        <Field label="Descripción">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Motivo del movimiento" />
        </Field>
        <Field label="Fecha">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl neu-inset px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/20 [color-scheme:dark]" />
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
