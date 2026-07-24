"use client"

import {
  CalendarDays,
  LayoutDashboard,
  Scissors,
  Settings,
  Users,
  UserSquare,
  Wallet,
  Wallet2,
} from "lucide-react"
import { useState } from "react"
import { Shell, type NavItem } from "@/components/shell"
import { AdminAgenda } from "./agenda"
import { AdminCash } from "./cash"
import { AdminClients } from "./clients"
import { AdminOverview } from "./overview"
import { AdminPayouts } from "./payouts"
import { AdminReportsSettings } from "./reports-settings"
import { AdminServices } from "./services"
import { AdminStaff } from "./staff"

const NAV: NavItem[] = [
  { key: "overview", label: "Resumen", icon: LayoutDashboard },
  { key: "cash", label: "Caja", icon: Wallet },
  { key: "staff", label: "Peluqueros", icon: Scissors },
  { key: "payouts", label: "Liquidaciones", icon: Wallet2 },
  { key: "agenda", label: "Agenda", icon: CalendarDays },
  { key: "clients", label: "Clientes", icon: Users },
  { key: "services", label: "Servicios", icon: UserSquare },
  { key: "reports", label: "Reportes & Config", icon: Settings },
]

export function AdminApp() {
  const [view, setView] = useState("overview")

  return (
    <Shell brand="Tucson Barber" nav={NAV} active={view} onNavigate={setView}>
      <div style={{ display: view === "overview" ? "" : "none" }}><AdminOverview onNavigate={setView} /></div>
      <div style={{ display: view === "cash" ? "" : "none" }}><AdminCash /></div>
      <div style={{ display: view === "staff" ? "" : "none" }}><AdminStaff /></div>
      <div style={{ display: view === "payouts" ? "" : "none" }}><AdminPayouts /></div>
      <div style={{ display: view === "agenda" ? "" : "none" }}><AdminAgenda /></div>
      <div style={{ display: view === "clients" ? "" : "none" }}><AdminClients /></div>
      <div style={{ display: view === "services" ? "" : "none" }}><AdminServices /></div>
      <div style={{ display: view === "reports" ? "" : "none" }}><AdminReportsSettings /></div>
    </Shell>
  )
}
