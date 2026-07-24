"use client"

import { ArrowDownRight, ArrowUpRight, Loader2, Plus, Trash2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { StatCard } from "@/components/stat-card"
import { Badge, Button, Card, Field, Input, Modal, SectionTitle, Select } from "@/components/ui-kit"
import { formatDate, money } from "@/lib/helpers"
import { todayStr } from "@/lib/seed"
import { apiClient } from "@/lib/api-client"
import type { CashMovement, MovementType } from "@/lib/types"

const INCOME_CATS = ["Servicio", "Venta de productos", "Propina", "Otro"]
const EXPENSE_CATS = ["Insumos", "Alquiler", "Sueldos", "Liquidación", "Servicios", "Otro"]

interface CashSummary {
  totalIncome: number
  totalExpense: number
  movements: CashMovement[]
}

export function AdminCash() {
  const [summary, setSummary] = useState<CashSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<MovementType | null>(null)
  const [filterType, setFilterType] = useState<"all" | MovementType>("all")
  const [filterDate, setFilterDate] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchSummary = useCallback(() => {
    setLoading(true)
    apiClient.get<CashSummary>("/api/cash/balance")
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchSummary() }, [fetchSummary])

  const totalIncome = summary?.totalIncome ?? 0
  const totalExpense = summary?.totalExpense ?? 0
  const movements = summary?.movements ?? []

  const filtered = useMemo(
    () =>
      movements
        .filter((m) => (filterType === "all" ? true : m.type === filterType))
        .filter((m) => (filterDate ? m.date === filterDate : true))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [movements, filterType, filterDate],
  )

  async function deleteMovement(id: string) {
    setDeletingId(id)
    const prev = movements
    setSummary((s) => s ? { ...s, movements: s.movements.filter((m) => m.id !== id) } : s)
    try {
      await apiClient.delete(`/api/cash/${id}`)
      fetchSummary()
    } catch {
      setSummary((s) => s ? { ...s, movements: prev } : s)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <SectionTitle
        title="Caja"
        subtitle="Flujo de ingresos y egresos"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="success" size="sm" onClick={() => setModal("income")}>
              <Plus className="size-4" /> Ingreso
            </Button>
            <Button variant="danger" size="sm" onClick={() => setModal("expense")}>
              <Plus className="size-4" /> Gasto
            </Button>
          </div>
        }
      />

      {loading && !summary ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard label="Ingresos totales" value={money(totalIncome)} icon={ArrowUpRight} tone="positive" />
            <StatCard label="Gastos totales" value={money(totalExpense)} icon={ArrowDownRight} tone="negative" />
            <StatCard
              label="Balance"
              value={money(totalIncome - totalExpense)}
              icon={ArrowUpRight}
              tone={totalIncome - totalExpense >= 0 ? "positive" : "negative"}
            />
          </div>

          <Card className="mt-4">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="mr-auto font-serif text-lg font-semibold">Historial de movimientos</h2>
              <Select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="w-36">
                <option value="all">Todos</option>
                <option value="income">Ingresos</option>
                <option value="expense">Gastos</option>
              </Select>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary [color-scheme:dark]"
              />
            </div>

            <div className="flex flex-col divide-y divide-border">
              {filtered.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">Sin movimientos.</p>
              )}
              {filtered.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-3">
                  <div
                    className={
                      "flex size-9 shrink-0 items-center justify-center rounded-full " +
                      (m.type === "income" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")
                    }
                  >
                    {m.type === "income" ? (
                      <ArrowUpRight className="size-4" />
                    ) : (
                      <ArrowDownRight className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.description}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Badge className="border-border text-muted-foreground">{m.category}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(m.date)}</span>
                    </div>
                  </div>
                  <span
                    className={
                      "text-sm font-semibold tabular-nums " +
                      (m.type === "income" ? "text-success" : "text-destructive")
                    }
                  >
                    {m.type === "income" ? "+" : "-"}
                    {money(m.amount)}
                  </span>
                  <button
                    onClick={() => deleteMovement(m.id)}
                    disabled={deletingId === m.id}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive disabled:opacity-50"
                    aria-label="Eliminar movimiento"
                  >
                    {deletingId === m.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {modal && <MovementModal type={modal} onClose={() => setModal(null)} onDone={fetchSummary} />}
    </div>
  )
}

function MovementModal({ type, onClose, onDone }: { type: MovementType; onClose: () => void; onDone: () => void }) {
  const cats = type === "income" ? INCOME_CATS : EXPENSE_CATS
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState(cats[0])
  const [date, setDate] = useState(todayStr())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    const value = Number(amount)
    if (!value || !description) return
    setSubmitting(true)
    setError("")
    try {
      await apiClient.post("/api/cash", { type, amount: value, description, category, date })
      onDone()
      onClose()
    } catch (err: any) {
      setError(err?.message ?? "Error al registrar")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={type === "income" ? "Registrar ingreso" : "Registrar gasto"}>
      <div className="grid gap-4">
        <Field label="Monto">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            autoFocus
          />
        </Field>
        <Field label="Descripción">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Venta de cera"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Categoría">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {cats.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary [color-scheme:dark]"
            />
          </Field>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant={type === "income" ? "success" : "danger"} onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Registrar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
