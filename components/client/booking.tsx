"use client"

import { Check, ChevronLeft, ChevronRight, Loader2, MapPin, Scissors, Sparkles, User } from "lucide-react"
import { useEffect, useState } from "react"
import { Button, Card, cn } from "@/components/ui-kit"
import { formatDate, money } from "@/lib/helpers"
import { useStore, todayStr } from "@/lib/store"
import { apiClient } from "@/lib/api-client"

const STEPS = ["Sucursal", "Servicio", "Barbero", "Fecha y hora", "Confirmar"]

function nextDates(count: number): string[] {
  const out: string[] = []
  const base = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    out.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    )
  }
  return out
}

export function ClientBooking({ onDone }: { onDone: () => void }) {
  const store = useStore()
  const { services, barbers, settings, session } = store
  const activeBarbers = barbers.filter((b) => b.active)

  const [step, setStep] = useState(0)
  const [serviceId, setServiceId] = useState("")
  const [barberId, setBarberId] = useState("any")
  const [date, setDate] = useState(todayStr())
  const [time, setTime] = useState("")
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [resolvedBarberId, setResolvedBarberId] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const service = services.find((s) => s.id === serviceId)

  useEffect(() => {
    if (barberId !== "any") { setResolvedBarberId(barberId); return }
    if (!service) { setResolvedBarberId(activeBarbers[0]?.id ?? ""); return }
    const checkAll = async () => {
      for (const b of activeBarbers) {
        try {
          const s = await apiClient.get<string[]>(
            `/api/schedules/availability?barberId=${b.id}&serviceId=${service.id}&date=${date}`
          )
          if (s.length > 0) { setResolvedBarberId(b.id); return }
        } catch { /* try next */ }
      }
      setResolvedBarberId(activeBarbers[0]?.id ?? "")
    }
    checkAll()
  }, [barberId, service?.id, date, activeBarbers])

  useEffect(() => {
    if (!service || !resolvedBarberId || !date) return
    setLoadingSlots(true)
    setTime("")
    setError("")
    apiClient.get<string[]>(
      `/api/schedules/availability?barberId=${resolvedBarberId}&serviceId=${service.id}&date=${date}`
    )
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [service?.id, resolvedBarberId, date])

  const canNext =
    (step === 0) ||
    (step === 1 && !!serviceId) ||
    (step === 2 && !!barberId) ||
    (step === 3 && !!time) ||
    step === 4

  async function confirm() {
    if (!service || !resolvedBarberId || !time) return
    setSubmitting(true)
    setError("")
    try {
      await apiClient.post("/api/appointments", {
        clientId: session.clientId,
        barberId: resolvedBarberId,
        serviceId,
        date,
        time,
      })
      onDone()
    } catch (err: any) {
      const msg = err?.message ?? ""
      if (msg.includes("409") || msg.includes("400")) {
        setError("Este horario ya no está disponible. Elegí otro.")
        apiClient.get<string[]>(
          `/api/schedules/availability?barberId=${resolvedBarberId}&serviceId=${service.id}&date=${date}`
        ).then(setSlots).catch(() => {})
        setTime("")
      } else {
        setError(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const chosenBarber = barbers.find((b) => b.id === resolvedBarberId)

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 font-serif text-2xl font-semibold text-foreground">Reservar turno</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Paso {step + 1} de {STEPS.length}: {STEPS[step]}
      </p>

      <div className="mb-6 flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-1">
            <div
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                i < step && "bg-primary text-primary-foreground",
                i === step && "bg-primary/20 text-primary ring-2 ring-primary",
                i > step && "bg-secondary text-muted-foreground",
              )}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-0.5 flex-1 rounded", i < step ? "bg-primary" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      <Card className="min-h-64">
        {step === 0 && (
          <div className="flex items-center gap-4 rounded-xl neu-raised p-4">
            <div className="flex size-11 items-center justify-center rounded-xl neu-inset-sm text-primary">
              <MapPin className="size-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">{settings.shopName}</p>
              <p className="text-sm text-muted-foreground">{settings.address}</p>
            </div>
            <Check className="ml-auto size-5 text-primary" />
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => setServiceId(s.id)}
                className={cn(
                  "flex items-center justify-between rounded-xl neu-raised p-4 text-left transition-all duration-200",
                  serviceId === s.id
                    ? "neu-inset text-primary"
                    : "hover:neu-raised-sm",
                )}
              >
                <div>
                  <p className="font-medium text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.durationMin} min</p>
                </div>
                <span className="font-semibold text-primary">{money(s.price)}</span>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <button
              onClick={() => setBarberId("any")}
              className={cn(
                "flex items-center gap-3 rounded-xl neu-raised p-4 text-left transition-all duration-200",
                barberId === "any" ? "neu-inset text-primary" : "hover:neu-raised-sm",
              )}
            >
              <div className="flex size-10 items-center justify-center rounded-full neu-raised-sm text-primary">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Cualquiera</p>
                <p className="text-xs text-muted-foreground">El primero disponible</p>
              </div>
            </button>
            {activeBarbers.map((b) => (
              <button
                key={b.id}
                onClick={() => setBarberId(b.id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl neu-raised p-4 text-left transition-all duration-200",
                  barberId === b.id ? "neu-inset text-primary" : "hover:neu-raised-sm",
                )}
              >
                <img
                  src={b.photo || "/placeholder.svg"}
                  alt={b.name}
                  className="size-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-foreground">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.workStart} - {b.workEnd} hs</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Elegí el día</p>
            <div className="mb-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {nextDates(10).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDate(d)
                    setTime("")
                  }}
                  className={cn(
                    "shrink-0 rounded-xl px-3 py-2 text-center text-xs transition-all duration-200",
                    date === d ? "neu-inset text-primary" : "neu-raised-sm hover:neu-raised",
                  )}
                >
                  {formatDate(d)}
                </button>
              ))}
            </div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Horarios libres</p>
            {loadingSlots ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : slots.length === 0 ? (
              <p className="rounded-xl neu-inset py-6 text-center text-sm text-muted-foreground">
                No hay horarios disponibles este día. Probá otra fecha.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {slots.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTime(t)}
                    className={cn(
                      "rounded-xl py-2 text-sm transition-all duration-200",
                      time === t ? "neu-inset text-primary" : "neu-raised-sm hover:neu-raised",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <Row icon={<MapPin className="size-4" />} label="Sucursal" value={settings.shopName} />
            <Row icon={<Scissors className="size-4" />} label="Servicio" value={`${service?.name} · ${money(service?.price ?? 0)}`} />
            <Row icon={<User className="size-4" />} label="Barbero" value={chosenBarber?.name ?? "-"} />
            <Row icon={<Check className="size-4" />} label="Fecha y hora" value={`${formatDate(date)} · ${time} hs`} />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ChevronLeft className="size-4" /> Atrás
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            Siguiente <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button variant="success" onClick={confirm} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Confirmar reserva
          </Button>
        )}
      </div>
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl neu-raised p-3">
      <div className="flex size-8 items-center justify-center rounded-lg neu-inset-sm text-primary">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}
