"use client"

import { CalendarPlus, Home, ListChecks, User } from "lucide-react"
import { useState } from "react"
import dynamic from "next/dynamic"
import { Shell, type NavItem } from "@/components/shell"

const ClientBooking = dynamic(() => import("./booking").then((m) => m.ClientBooking), { ssr: false })
const ClientHome = dynamic(() => import("./home").then((m) => m.ClientHome), { ssr: false })
const ClientProfile = dynamic(() => import("./profile").then((m) => m.ClientProfile), { ssr: false })
const ClientAppointments = dynamic(() => import("./appointments").then((m) => m.ClientAppointments), { ssr: false })

const NAV: NavItem[] = [
  { key: "home", label: "Inicio", icon: Home },
  { key: "book", label: "Reservar", icon: CalendarPlus },
  { key: "appointments", label: "Mis Turnos", icon: ListChecks },
  { key: "profile", label: "Perfil", icon: User },
]

export function ClientApp() {
  const [view, setView] = useState("home")

  return (
    <Shell brand="Tucson Barber" nav={NAV} active={view} onNavigate={setView}>
      {view === "home" && <ClientHome onNavigate={setView} />}
      {view === "book" && <ClientBooking onDone={() => setView("appointments")} />}
      {view === "appointments" && <ClientAppointments onBook={() => setView("book")} />}
      {view === "profile" && <ClientProfile />}
    </Shell>
  )
}
