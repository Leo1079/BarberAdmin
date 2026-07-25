"use client"

import { Award, Loader2, Star, TrendingUp } from "lucide-react"
import useSWR from "swr"
import { StatCard } from "@/components/stat-card"
import { Card, SectionTitle } from "@/components/ui-kit"
import { swrFetcher, SWR_CONFIG } from "@/lib/swr-fetcher"
import { money } from "@/lib/helpers"
import type { Appointment, Barber, Service } from "@/lib/types"

export function AdminReportsSettings() {
  const { data: appointments = [] } = useSWR<Appointment[]>("/api/appointments", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const { data: services = [] } = useSWR<Service[]>("/api/services", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const { data: barbers = [], isLoading } = useSWR<Barber[]>("/api/barbers", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const loading = isLoading

  if (loading) {
    return <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
  }

  const barberRanking = barbers
    .map((b) => ({
      b,
      total: appointments
        .filter((a) => a.barberId === b.id && a.status === "COMPLETED")
        .reduce((s, a) => s + (services.find((x) => x.id === a.serviceId)?.price ?? 0), 0),
    }))
    .sort((a, b) => b.total - a.total)
  const starBarber = barberRanking[0]

  const serviceCount = services
    .map((s) => ({
      s,
      count: appointments.filter((a) => a.serviceId === s.id && a.status === "COMPLETED").length,
    }))
    .sort((a, b) => b.count - a.count)
  const topService = serviceCount[0]

  return (
    <div>
      <SectionTitle title="Reportes" subtitle="Métricas consolidadas" />

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Barbero estrella"
          value={starBarber?.b.name ?? "-"}
          icon={Award}
          hint={starBarber ? `${money(starBarber.total)} facturados` : undefined}
          tone="primary"
        />
        <StatCard
          label="Servicio más vendido"
          value={topService?.s.name ?? "-"}
          icon={Star}
          hint={topService ? `${topService.count} realizados` : undefined}
          tone="primary"
        />
      </div>

      <Card className="mt-4">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" />
          <h2 className="font-serif text-lg font-semibold">Ranking de barberos</h2>
        </div>
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <div className="flex min-w-[500px] flex-col gap-3">
            {barberRanking.map((r, i) => {
              const max = barberRanking[0]?.total || 1
              return (
                <div key={r.b.id} className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-center font-serif font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="shrink-0 text-sm font-medium">{r.b.name}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(r.total / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                    {money(r.total)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </Card>
    </div>
  )
}
