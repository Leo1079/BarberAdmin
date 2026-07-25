"use client"

import { ArrowDownRight, ArrowUpRight, Clock, Scissors, TrendingUp, Wallet } from "lucide-react"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts"
import useSWR from "swr"
import { StatCard } from "@/components/stat-card"
import { Badge, Card, SectionTitle } from "@/components/ui-kit"
import { formatDate, money, STATUS_META } from "@/lib/helpers"
import { todayStr } from "@/lib/helpers"
import { swrFetcher, SWR_CONFIG } from "@/lib/swr-fetcher"
import type { AppointmentStatus } from "@/lib/types"

interface OwnerDashboard {
  today: { appointments: Record<string, number>; totalAppointments: number; income: number; expense: number; balance: number }
  week: { date: string; income: number; expense: number }[]
}

export function AdminOverview({ onNavigate }: { onNavigate: (k: string) => void }) {
  const { data, isLoading } = useSWR<OwnerDashboard>(
    "/api/dashboard/owner",
    swrFetcher,
    { ...SWR_CONFIG, fallbackData: null },
  )
  const loading = isLoading

  if (loading || !data) {
    return <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
  }

  const today = data.today

  const todayStatusMeta: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Pendiente", className: "bg-warning/15 text-warning border-warning/30" },
    CONFIRMED: { label: "Confirmado", className: "bg-primary/15 text-primary border-primary/30" },
    IN_PROGRESS: { label: "En curso", className: "bg-info/15 text-info border-info/30" },
    COMPLETED: { label: "Completado", className: "bg-success/15 text-success border-success/30" },
    CANCELLED: { label: "Cancelado", className: "bg-destructive/15 text-destructive border-destructive/30" },
  }
  const todayApptStatuses = Object.entries(data.today.appointments)

  const weekData = data.week.map((w) => {
    const d = new Date(w.date + "T12:00:00")
    return { ...w, label: d.toLocaleDateString("es-AR", { weekday: "short" }) }
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

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-serif text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" /> Balance de la semana
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }}
                formatter={(v: number) => money(v)}
              />
              <Bar dataKey="income" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Ingresos" />
              <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Gastos" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="mb-4 font-serif text-lg font-semibold text-foreground flex items-center gap-2">
            <Clock className="size-5 text-primary" /> Turnos hoy
          </h2>
          {todayApptStatuses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin turnos</p>
          ) : (
            <div className="flex flex-col gap-2">
              {todayApptStatuses.map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge className={todayStatusMeta[status]?.className ?? ""}>
                    {todayStatusMeta[status]?.label ?? status}
                  </Badge>
                  <span className="font-semibold tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
