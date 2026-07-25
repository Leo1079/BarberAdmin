"use client"

import { Loader2 } from "lucide-react"
import useSWR from "swr"
import { Card, SectionTitle } from "@/components/ui-kit"
import { formatDate, money } from "@/lib/helpers"
import { swrFetcher, SWR_CONFIG } from "@/lib/swr-fetcher"
import type { Adjustment, Payout } from "@/lib/types"

export function BarberCommissions() {
  const { data: payouts = [], isLoading: loadingPayouts } = useSWR<Payout[]>("/api/commissions/payouts", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const { data: adjustments = [], isLoading: loadingAdjustments } = useSWR<Adjustment[]>("/api/commissions/adjustments", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const loading = loadingPayouts || loadingAdjustments

  if (loading) {
    return <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
  }

  return (
    <div>
      <SectionTitle title="Mis Comisiones" subtitle="Historial de liquidaciones y ajustes" />

      <Card>
        <h2 className="mb-4 font-serif text-lg font-semibold">Liquidaciones</h2>
        {payouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no tenés liquidaciones registradas.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {payouts.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-3">
                <div>
                  <p className="text-sm text-muted-foreground">{formatDate(p.date)}</p>
                  <p className="text-xs text-muted-foreground">{money(p.totalGenerated)} generado · {p.commissionPct}% comisión</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums text-success">{money(p.total)}</p>
                  <p className="text-xs text-muted-foreground">{money(p.commission)} - {money(p.advances + p.discounts)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <h2 className="mb-4 font-serif text-lg font-semibold">Adelantos y descuentos</h2>
        {adjustments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin movimientos registrados.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {adjustments.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-3 text-sm">
                <div>
                  <span className="font-medium">{a.type === "advance" ? "Adelanto" : "Descuento"}</span>
                  {a.description && <span className="text-muted-foreground"> · {a.description}</span>}
                  <p className="text-xs text-muted-foreground">{formatDate(a.date)}</p>
                </div>
                <span className="font-medium text-destructive tabular-nums">-{money(a.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
