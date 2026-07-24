"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, Field, Input, Button } from "@/components/ui-kit"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const loggedUser = await login(email, password)
      const role = (loggedUser.role || "").toUpperCase()
      if (role === "OWNER" || role === "ADMIN") {
        router.push("/admin")
      } else if (role === "BARBER") {
        router.push("/barber")
      } else {
        router.push("/client")
      }
    } catch (err: any) {
      setError(err?.message || "Error al iniciar sesión. Revisa tus credenciales.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Tucson Barber
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresá con tu cuenta para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          <Field label="Correo electrónico">
            <Input
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field label="Contraseña">
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          <Button type="submit" variant="primary" className="mt-2 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Ingresando..." : "Iniciar Sesión"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
