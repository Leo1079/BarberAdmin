"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Card, Field, SectionTitle } from "@/components/ui-kit"
import { formatDate, money } from "@/lib/helpers"
import { useAuth } from "@/lib/auth-context"
import { swrFetcher, SWR_CONFIG } from "@/lib/swr-fetcher"
import type { Appointment, Barber } from "@/lib/types"

export function BarberHistory() {
  const { user } = useAuth()
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const { data: appointments = [] } = useSWR<Appointment[]>("/api/appointments?status=COMPLETED", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const { data: barbers = [] } = useSWR<Barber[]>("/api/barbers", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })

  const barberId = user?.barberId
  const barber = barbers.find((b) => b.id === barberId)

  const history = useMemo(
    () =>
      appointments
        .filter((a) => a.barberId === barberId && (!from || a.date >= from) && (!to || a.date <= to))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [appointments, barberId, from, to],
  )

  const inputCls = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary [color-scheme:dark]"

  return (
    <div>
      <SectionTitle title="Historial & Perfil" subtitle="Tus cortes realizados y tu disponibilidad" />

      <Card className="mb-4">
        <h2 className="mb-4 font-serif text-lg font-semibold">Mi perfil y horario</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="size-16 rounded-full bg-secondary/60 flex items-center justify-center text-2xl font-serif">
            {barber?.name?.charAt(0) ?? "?"}
          </div>
          <div className="flex-1">
            <p className="font-medium">{barber?.name}</p>
            <p className="text-sm text-muted-foreground">Comisión: {barber?.commissionPct}%</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Entrada"><input type="time" value={barber?.workStart ?? "09:00"} disabled className={inputCls} /></Field>
            <Field label="Salida"><input type="time" value={barber?.workEnd ?? "20:00"} disabled className={inputCls} /></Field>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-serif text-lg font-semibold">Cortes realizados ({history.length})</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
            <Field label="Desde"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} /></Field>
            <Field label="Hasta"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} /></Field>
          </div>
        </div>
        {history.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin cortes en este período.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {history.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{a.client?.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{a.service?.name ?? "—"} · {formatDate(a.date)} · {a.time}</p>
                </div>
                <span className="font-medium tabular-nums text-primary">{money(a.service?.price ?? 0)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
