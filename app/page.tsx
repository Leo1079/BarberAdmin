"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function Page() {
  const { user, accessToken, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!accessToken) {
      router.push("/login")
      return
    }

    const role = (user?.role || "").toUpperCase()
    if (role === "OWNER" || role === "ADMIN") {
      router.push("/admin")
    } else if (role === "BARBER") {
      router.push("/barber")
    } else {
      router.push("/client")
    }
  }, [user, accessToken, loading, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-muted-foreground">Cargando...</div>
    </div>
  )
}

