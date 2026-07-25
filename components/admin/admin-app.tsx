"use client"

import { CalendarDays, LayoutDashboard, Scissors, Settings, Users, UserSquare, Wallet, Wallet2 } from "lucide-react"
import { useState } from "react"
import dynamic from "next/dynamic"
import { Shell, type NavItem } from "@/components/shell"

const AdminAgenda = dynamic(() => import("./agenda").then((m) => m.AdminAgenda), { ssr: false })
const AdminCash = dynamic(() => import("./cash").then((m) => m.AdminCash), { ssr: false })
const AdminClients = dynamic(() => import("./clients").then((m) => m.AdminClients), { ssr: false })
const AdminOverview = dynamic(() => import("./overview").then((m) => m.AdminOverview), { ssr: false })
const AdminPayouts = dynamic(() => import("./payouts").then((m) => m.AdminPayouts), { ssr: false })
const AdminReportsSettings = dynamic(() => import("./reports-settings").then((m) => m.AdminReportsSettings), { ssr: false })
const AdminServices = dynamic(() => import("./services").then((m) => m.AdminServices), { ssr: false })
const AdminStaff = dynamic(() => import("./staff").then((m) => m.AdminStaff), { ssr: false })

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
      {view === "overview" && <AdminOverview onNavigate={setView} />}
      {view === "cash" && <AdminCash />}
      {view === "staff" && <AdminStaff />}
      {view === "payouts" && <AdminPayouts />}
      {view === "agenda" && <AdminAgenda />}
      {view === "clients" && <AdminClients />}
      {view === "services" && <AdminServices />}
      {view === "reports" && <AdminReportsSettings />}
    </Shell>
  )
}
