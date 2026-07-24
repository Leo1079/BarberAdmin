"use client"

import { AdminApp } from "@/components/admin/admin-app"
import { BarberApp } from "@/components/barber/barber-app"
import { ClientApp } from "@/components/client/client-app"
import { useAuth } from "@/lib/auth-context"

export function Dashboard() {
  const { user } = useAuth()

  const role = (user?.role || "").toLowerCase()

  if (role === "admin" || role === "owner") return <AdminApp />
  if (role === "barber") return <BarberApp />
  return <ClientApp />
}
