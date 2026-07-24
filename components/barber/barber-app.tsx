"use client"

import { CalendarDays, HandCoins, History, LayoutDashboard, Wallet, Wallet2 } from "lucide-react"
import { useState } from "react"
import { Shell, type NavItem } from "@/components/shell"
import { BarberAdvanceRequestForm } from "./advance-request-form"
import { BarberAgenda } from "./agenda"
import { BarberCommissions } from "./commissions"
import { BarberHistory } from "./history"
import { BarberHome } from "./home"
import { BarberIncome } from "./income"

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
      <div style={{ display: view === "home" ? "" : "none" }}><BarberHome onNavigate={setView} /></div>
      <div style={{ display: view === "agenda" ? "" : "none" }}><BarberAgenda /></div>
      <div style={{ display: view === "income" ? "" : "none" }}><BarberIncome /></div>
      <div style={{ display: view === "commissions" ? "" : "none" }}><BarberCommissions /></div>
      <div style={{ display: view === "advance" ? "" : "none" }}><BarberAdvanceRequestForm /></div>
      <div style={{ display: view === "history" ? "" : "none" }}><BarberHistory /></div>
    </Shell>
  )
}
