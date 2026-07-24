"use client"

import { Loader2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Card, SectionTitle } from "@/components/ui-kit"
import { formatDate, money } from "@/lib/helpers"
import { apiClient } from "@/lib/api-client"
import type { Adjustment, Payout } from "@/lib/types"

export function BarberCommissions() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [adjustments, setAdjustments] = useState<Adjustment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [payoutsData, adjustmentsData] = await Promise.all([
        apiClient.get<Payout[]>("/api/commissions/payouts"),
        apiClient.get<Adjustment[]>("/api/commissions/adjustments"),
      ])
      setPayouts(payoutsData)
      setAdjustments(adjustmentsData)
    } catch (err: any) {
      setError(err?.message || "Error al cargar comisiones")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex justify-center py-12 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <SectionTitle title="Mis Comisiones" subtitle="Historial de liquidaciones y ajustes" />

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <h2 className="mb-4 font-serif text-lg font-semibold">Liquidaciones</h2>
        {payouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no tenés liquidaciones registradas.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {payouts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-muted-foreground">{formatDate(p.date)}</p>
                  <p className="text-xs text-muted-foreground">
                    {money(p.totalGenerated)} generado · {p.commissionPct}% comisión
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums text-success">{money(p.total)}</p>
                  <p className="text-xs text-muted-foreground">
                    {money(p.commission)} - {money(p.advances + p.discounts)}
                  </p>
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
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-medium">
                    {a.type === "advance" ? "Adelanto" : "Descuento"}
                  </span>
                  {a.description && (
                    <span className="text-muted-foreground"> · {a.description}</span>
                  )}
                  <p className="text-xs text-muted-foreground">{formatDate(a.date)}</p>
                </div>
                <span className="font-medium text-destructive tabular-nums">
                  -{money(a.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
