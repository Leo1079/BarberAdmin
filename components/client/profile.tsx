"use client"

import { Loader2 } from "lucide-react"
import useSWR from "swr"
import { Card, SectionTitle } from "@/components/ui-kit"
import { swrFetcher, SWR_CONFIG } from "@/lib/swr-fetcher"
import type { Client } from "@/lib/types"

export function ClientProfile() {
  const { data: clients = [], isLoading } = useSWR<Client[]>("/api/clients", swrFetcher, { ...SWR_CONFIG, fallbackData: [] })
  const loading = isLoading
  const client = clients[0]

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
