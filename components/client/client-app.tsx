"use client"

import { CalendarPlus, Home, ListChecks, User } from "lucide-react"
import { useState } from "react"
import { Shell, type NavItem } from "@/components/shell"
import { ClientBooking } from "./booking"
import { ClientHome } from "./home"
import { ClientProfile } from "./profile"
import { ClientAppointments } from "./appointments"

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
