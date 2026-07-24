"use client"

import { Loader2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Card, SectionTitle } from "@/components/ui-kit"
import { apiClient } from "@/lib/api-client"
import type { Client } from "@/lib/types"

export function ClientProfile() {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchClient = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiClient.get<Client[]>("/api/clients")
      setClient(data[0] ?? null)
    } catch {
      // silence
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClient()
  }, [fetchClient])

  if (loading) {
    return <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
  }

  return (
    <div>
      <SectionTitle title="Mi perfil" subtitle="Tus datos personales" />

      <Card className="max-w-md">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Nombre</p>
            <p className="text-sm font-medium">{client?.name ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Teléfono</p>
            <p className="text-sm font-medium">{client?.phone ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Email</p>
            <p className="text-sm font-medium">{client?.email ?? "-"}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
