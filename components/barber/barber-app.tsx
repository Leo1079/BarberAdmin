"use client"

import { CalendarDays, HandCoins, History, LayoutDashboard, Wallet, Wallet2 } from "lucide-react"
import { useState } from "react"
import dynamic from "next/dynamic"
import { Shell, type NavItem } from "@/components/shell"

const BarberAdvanceRequestForm = dynamic(() => import("./advance-request-form").then((m) => m.BarberAdvanceRequestForm), { ssr: false })
const BarberAgenda = dynamic(() => import("./agenda").then((m) => m.BarberAgenda), { ssr: false })
const BarberCommissions = dynamic(() => import("./commissions").then((m) => m.BarberCommissions), { ssr: false })
const BarberHistory = dynamic(() => import("./history").then((m) => m.BarberHistory), { ssr: false })
const BarberHome = dynamic(() => import("./home").then((m) => m.BarberHome), { ssr: false })
const BarberIncome = dynamic(() => import("./income").then((m) => m.BarberIncome), { ssr: false })

const NAV: NavItem[] = [
  { key: "home", label: "Inicio", icon: LayoutDashboard },
  { key: "agenda", label: "Mi Agenda", icon: CalendarDays },
  { key: "income", label: "Mis Ingresos", icon: Wallet },
  { key: "commissions", label: "Comisiones", icon: Wallet2 },
  { key: "advance", label: "Pedir Adelanto", icon: HandCoins },
  { key: "history", label: "Historial & Perfil", icon: History },
]

export function BarberApp() {
  const [view, setView] = useState("home")

  return (
    <Shell brand="Tucson Barber" nav={NAV} active={view} onNavigate={setView}>
      {view === "home" && <BarberHome onNavigate={setView} />}
      {view === "agenda" && <BarberAgenda />}
      {view === "income" && <BarberIncome />}
      {view === "commissions" && <BarberCommissions />}
      {view === "advance" && <BarberAdvanceRequestForm />}
      {view === "history" && <BarberHistory />}
    </Shell>
  )
}
