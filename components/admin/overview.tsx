"use client"

import { ArrowDownRight, ArrowUpRight, Clock, Scissors, TrendingUp, Wallet } from "lucide-react"
import { Loader2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { StatCard } from "@/components/stat-card"
import { Badge, Card, SectionTitle } from "@/components/ui-kit"
import { formatDate, money, STATUS_META } from "@/lib/helpers"
import { todayStr } from "@/lib/seed"
import { apiClient } from "@/lib/api-client"

interface OwnerDashboard {
  today: {
    appointments: Record<string, number>
    totalAppointments: number
    income: number
    expense: number
    balance: number
  }
  month: {
    income: number
    expense: number
    balance: number
    topBarber: { id: string; name: string } | null
    topServices: Array<{ id: string; name: string; price: number; count: number }>
    newClients: number
    recurringClients: number
  }
}

export function AdminOverview({ onNavigate }: { onNavigate: (k: string) => void }) {
  const [data, setData] = useState<OwnerDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await apiClient.get<OwnerDashboard>("/api/dashboard/owner")
      setData(result)
    } catch {
      // silence
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading || !data) {
    return (
      <div className="flex justify-center py-12 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  const { today, month } = data
  const todayStatusMeta: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Pendiente", className: "bg-warning/15 text-warning border-warning/30" },
    CONFIRMED: { label: "Confirmado", className: "bg-primary/15 text-primary border-primary/30" },
    IN_PROGRESS: { label: "En curso", className: "bg-info/15 text-info border-info/30" },
    COMPLETED: { label: "Completado", className: "bg-success/15 text-success border-success/30" },
    CANCELLED: { label: "Cancelado", className: "bg-destructive/15 text-destructive border-destructive/30" },
  }
  const todayApptStatuses = Object.entries(data.today.appointments)

  const weekData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const ds = todayStr(d)
    return { label: d.toLocaleDateString("es-AR", { weekday: "short" }), total: 0 }
  })

  return (
    <div>
      <SectionTitle title="Resumen del día" subtitle={formatDate(todayStr())} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Ingresos hoy" value={money(today.income)} icon={ArrowUpRight} tone="positive" />
        <StatCard label="Gastos hoy" value={money(today.expense)} icon={ArrowDownRight} tone="negative" />
        <StatCard
          label="Balance"
          value={money(today.balance)}
          icon={Wallet}
          tone={today.balance >= 0 ? "positive" : "negative"}
        />
        <StatCard label="Cortes realizados" value={today.totalAppointments} icon={Scissors} tone="primary" />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            <h2 className="font-serif text-lg font-semibold">Resumen del mes</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Ingresos del mes</p>
              <p className="text-2xl font-serif font-bold text-success">{money(month.income)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gastos del mes</p>
              <p className="text-2xl font-serif font-bold text-destructive">{money(month.expense)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Balance mensual</p>
              <p className="text-2xl font-serif font-bold" style={{ color: month.balance >= 0 ? "#16a34a" : "#dc2626" }}>
                {money(month.balance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clientes nuevos / recurrentes</p>
              <p className="text-xl font-serif font-bold">{month.newClients} / {month.recurringClients}</p>
            </div>
          </div>
          {month.topBarber && (
            <p className="mt-3 text-sm text-muted-foreground">
              Barbero destacado: <span className="font-medium text-foreground">{month.topBarber.name}</span>
            </p>
          )}
          {month.topServices.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">Servicios más solicitados:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {month.topServices.map((s) => (
                  <Badge key={s.id} className="bg-primary/10 text-primary border-primary/20">
                    {s.name} ×{s.count}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            <h2 className="font-serif text-lg font-semibold">Turnos hoy</h2>
          </div>
          {todayApptStatuses.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin turnos hoy.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {todayApptStatuses.map(([status, count]) => (
                <li key={status} className="flex items-center justify-between rounded-xl neu-raised p-2.5">
                  <Badge className={todayStatusMeta[status]?.className ?? ""}>
                    {todayStatusMeta[status]?.label ?? status}
                  </Badge>
                  <span className="text-sm font-semibold tabular-nums">{count}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={() => onNavigate("agenda")}
            className="mt-3 w-full rounded-xl neu-raised py-2 text-xs font-medium text-muted-foreground transition-all duration-200 hover:text-foreground active:neu-inset"
          >
            Ver agenda completa
          </button>
        </Card>
      </div>
    </div>
  )
}
